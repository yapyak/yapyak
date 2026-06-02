export type Language =
  | 'tsx'
  | 'ts'
  | 'jsx'
  | 'js'
  | 'svelte'
  | 'vue'
  | 'astro'
  | 'bash'
  | 'json'
  | 'diff'
  | 'html'
  | 'yaml';

export type TokenType =
  | 'plain'
  | 'keyword'
  | 'type'
  | 'literal'
  | 'string'
  | 'template'
  | 'number'
  | 'comment'
  | 'fn-call'
  | 'jsx-tag'
  | 'punct'
  | 'tx-call'
  | 'tx-source'
  | 'tx-yapyak'
  | 'diff-add'
  | 'diff-remove'
  | 'diff-hunk'
  | 'bash-var'
  | 'bash-flag';

export interface Token {
  type: TokenType;
  value: string;
}

const KEYWORDS = new Set([
  'import',
  'export',
  'from',
  'as',
  'default',
  'const',
  'let',
  'var',
  'function',
  'async',
  'await',
  'return',
  'if',
  'else',
  'for',
  'while',
  'do',
  'switch',
  'case',
  'break',
  'continue',
  'new',
  'this',
  'super',
  'class',
  'extends',
  'implements',
  'type',
  'interface',
  'enum',
  'namespace',
  'public',
  'private',
  'protected',
  'static',
  'readonly',
  'abstract',
  'declare',
  'is',
  'in',
  'of',
  'void',
  'try',
  'catch',
  'finally',
  'throw',
  'yield',
  'typeof',
  'instanceof',
]);

const BUILTIN_TYPES = new Set([
  'string',
  'number',
  'boolean',
  'never',
  'any',
  'unknown',
  'object',
  'symbol',
  'bigint',
  'Date',
  'Array',
  'Promise',
  'Record',
  'Partial',
  'Required',
  'Readonly',
  'Pick',
  'Omit',
  'ReturnType',
  'Parameters',
]);

const LITERALS = new Set(['true', 'false', 'null', 'undefined']);

const YAPYAK_STRING = /^(["'`])yapyak(?:\/[\w-]+)*\1$/;

export function tokenize(code: string, language: Language): Token[] {
  if (language === 'diff') {
    return tokenizeDiff(code);
  }
  if (language === 'bash') {
    return tokenizeBash(code);
  }
  if (language === 'html') {
    return tokenizeHtml(code);
  }
  if (language === 'yaml') {
    return tokenizeYaml(code);
  }
  if (language === 'json') {
    return tokenizeJson(code);
  }
  const tokens: Token[] = [];
  let index = 0;
  while (index < code.length) {
    const result = scanToken(code, index, language);
    if (result === null) {
      tokens.push({ type: 'plain', value: code[index] ?? '' });
      index++;
    } else {
      tokens.push(result.token);
      index = result.end;
    }
  }
  applyYapyakHighlight(tokens);
  reclassifyJsxText(tokens);
  return mergePlainTokens(tokens);
}

function tokenizeDiff(code: string) {
  const tokens: Token[] = [];
  const lines = code.split('\n');
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index] ?? '';
    const trailing = index < lines.length - 1 ? '\n' : '';
    if (line.startsWith('@@')) {
      tokens.push({ type: 'diff-hunk', value: line + trailing });
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      tokens.push({ type: 'diff-add', value: line + trailing });
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      tokens.push({ type: 'diff-remove', value: line + trailing });
    } else {
      tokens.push({ type: 'plain', value: line + trailing });
    }
  }
  return mergePlainTokens(tokens);
}

function tokenizeBash(code: string) {
  const tokens: Token[] = [];
  let index = 0;
  let atLineStart = true;
  while (index < code.length) {
    const character = code[index] ?? '';

    if (
      character === ' ' ||
      character === '\t' ||
      character === '\n' ||
      character === '\r'
    ) {
      const match = /^[\s]+/.exec(code.slice(index));
      if (match) {
        tokens.push({ type: 'plain', value: match[0] });
        if (match[0].includes('\n')) {
          atLineStart = true;
        }
        index += match[0].length;
        continue;
      }
    }

    if (character === '#') {
      const newline = code.indexOf('\n', index);
      const value =
        newline === -1 ? code.slice(index) : code.slice(index, newline);
      tokens.push({ type: 'comment', value });
      index += value.length;
      continue;
    }

    if (character === "'" || character === '"') {
      const re =
        character === "'" ? /^'(?:\\.|[^'\\])*'/ : /^"(?:\\.|[^"\\])*"/;
      const match = re.exec(code.slice(index));
      if (match) {
        tokens.push({ type: 'string', value: match[0] });
        index += match[0].length;
        continue;
      }
    }

    if (character === '$') {
      const braced = /^\$\{[^}]+\}/.exec(code.slice(index));
      if (braced) {
        tokens.push({ type: 'bash-var', value: braced[0] });
        index += braced[0].length;
        continue;
      }
      const plain = /^\$[A-Za-z_][\w]*/.exec(code.slice(index));
      if (plain) {
        tokens.push({ type: 'bash-var', value: plain[0] });
        index += plain[0].length;
        continue;
      }
    }

    if (character === '-') {
      const previous = index > 0 ? (code[index - 1] ?? '') : '';
      const isWordContinuation = /[A-Za-z0-9_./@-]/.test(previous);
      if (!isWordContinuation) {
        const flag = /^--?[A-Za-z][\w-]*/.exec(code.slice(index));
        if (flag) {
          tokens.push({ type: 'bash-flag', value: flag[0] });
          index += flag[0].length;
          continue;
        }
      }
    }

    if (character >= '0' && character <= '9') {
      const match = /^\d+(?:\.\d+)?/.exec(code.slice(index));
      if (match) {
        tokens.push({ type: 'number', value: match[0] });
        index += match[0].length;
        continue;
      }
    }

    if (atLineStart && /[A-Za-z_]/.test(character)) {
      const match = /^[A-Za-z_][\w-]*/.exec(code.slice(index));
      if (match) {
        tokens.push({ type: 'fn-call', value: match[0] });
        atLineStart = false;
        index += match[0].length;
        continue;
      }
    }

    if (character !== '\n') {
      atLineStart = false;
    }
    tokens.push({ type: 'plain', value: character });
    index++;
  }
  return mergePlainTokens(tokens);
}

function tokenizeHtml(code: string) {
  const tokens: Token[] = [];
  let index = 0;
  let mode: 'text' | 'tag' = 'text';

  while (index < code.length) {
    if (mode === 'text') {
      if (code.startsWith('<!--', index)) {
        const end = code.indexOf('-->', index + 4);
        const stop = end === -1 ? code.length : end + 3;
        tokens.push({ type: 'comment', value: code.slice(index, stop) });
        index = stop;
        continue;
      }

      if (code[index] === '<') {
        const match = /^<\/?[A-Za-z][\w.-]*/.exec(code.slice(index));
        if (match) {
          tokens.push({ type: 'jsx-tag', value: match[0] });
          index += match[0].length;
          mode = 'tag';
          continue;
        }
      }

      const nextOpen = code.indexOf('<', index);
      const stop = nextOpen === -1 ? code.length : nextOpen;
      tokens.push({ type: 'plain', value: code.slice(index, stop) });
      index = stop;
      continue;
    }

    if (code[index] === '/' && code[index + 1] === '>') {
      tokens.push({ type: 'jsx-tag', value: '/>' });
      index += 2;
      mode = 'text';
      continue;
    }

    if (code[index] === '>') {
      tokens.push({ type: 'jsx-tag', value: '>' });
      index++;
      mode = 'text';
      continue;
    }

    const whitespace = /^[\s]+/.exec(code.slice(index));
    if (whitespace) {
      tokens.push({ type: 'plain', value: whitespace[0] });
      index += whitespace[0].length;
      continue;
    }

    if (code[index] === '=') {
      tokens.push({ type: 'punct', value: '=' });
      index++;
      continue;
    }

    if (code[index] === '"' || code[index] === "'") {
      const quote = code[index];
      const regex = quote === "'" ? /^'(?:\\.|[^'\\])*'/ : /^"(?:\\.|[^"\\])*"/;
      const match = regex.exec(code.slice(index));
      if (match) {
        tokens.push({ type: 'string', value: match[0] });
        index += match[0].length;
        continue;
      }
    }

    const attribute = /^[A-Za-z_:@][\w:.-]*/.exec(code.slice(index));
    if (attribute) {
      tokens.push({ type: 'fn-call', value: attribute[0] });
      index += attribute[0].length;
      continue;
    }

    tokens.push({ type: 'plain', value: code[index] ?? '' });
    index++;
  }

  return mergePlainTokens(tokens);
}

function tokenizeYaml(code: string) {
  const tokens: Token[] = [];
  const lines = code.split('\n');

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex] ?? '';
    const trailing = lineIndex < lines.length - 1 ? '\n' : '';
    let cursor = 0;

    const indent = /^[ \t]*/.exec(line)?.[0] ?? '';
    if (indent) {
      tokens.push({ type: 'plain', value: indent });
      cursor += indent.length;
    }

    if (cursor >= line.length) {
      if (trailing) {
        tokens.push({ type: 'plain', value: trailing });
      }
      continue;
    }

    if (line[cursor] === '#') {
      tokens.push({ type: 'comment', value: line.slice(cursor) + trailing });
      continue;
    }

    if (
      line[cursor] === '-' &&
      (line[cursor + 1] === ' ' || cursor + 1 === line.length)
    ) {
      tokens.push({ type: 'punct', value: '-' });
      cursor++;
    }

    while (cursor < line.length && line[cursor] === ' ') {
      tokens.push({ type: 'plain', value: ' ' });
      cursor++;
    }

    if (cursor >= line.length) {
      if (trailing) {
        tokens.push({ type: 'plain', value: trailing });
      }
      continue;
    }

    const keyMatch = /^([A-Za-z_][\w-]*)(\s*:)(\s|$)/.exec(line.slice(cursor));
    if (keyMatch) {
      tokens.push({ type: 'keyword', value: keyMatch[1] ?? '' });
      tokens.push({ type: 'punct', value: keyMatch[2] ?? '' });
      cursor += (keyMatch[1]?.length ?? 0) + (keyMatch[2]?.length ?? 0);
    }

    while (cursor < line.length) {
      const remainder = line.slice(cursor);

      const ws = /^[ \t]+/.exec(remainder);
      if (ws) {
        tokens.push({ type: 'plain', value: ws[0] });
        cursor += ws[0].length;
        continue;
      }

      if (remainder[0] === '#') {
        tokens.push({ type: 'comment', value: line.slice(cursor) });
        cursor = line.length;
        continue;
      }

      if (remainder[0] === '"' || remainder[0] === "'") {
        const quote = remainder[0];
        const regex =
          quote === "'" ? /^'(?:\\.|[^'\\])*'/ : /^"(?:\\.|[^"\\])*"/;
        const match = regex.exec(remainder);
        if (match) {
          tokens.push({ type: 'string', value: match[0] });
          cursor += match[0].length;
          continue;
        }
      }

      const numberMatch = /^-?\d+(?:\.\d+)?(?=\s|$|,)/.exec(remainder);
      if (numberMatch) {
        tokens.push({ type: 'number', value: numberMatch[0] });
        cursor += numberMatch[0].length;
        continue;
      }

      const literalMatch = /^(true|false|null|~)(?=\s|$|,)/.exec(remainder);
      if (literalMatch) {
        tokens.push({ type: 'literal', value: literalMatch[0] });
        cursor += literalMatch[0].length;
        continue;
      }

      tokens.push({ type: 'plain', value: remainder });
      cursor = line.length;
    }

    if (trailing) {
      tokens.push({ type: 'plain', value: trailing });
    }
  }

  return mergePlainTokens(tokens);
}

function tokenizeJson(code: string) {
  const tokens: Token[] = [];
  let index = 0;
  let lastWas: 'open' | 'colon' | 'comma' | 'value' | null = null;

  while (index < code.length) {
    const character = code[index] ?? '';

    if (
      character === ' ' ||
      character === '\t' ||
      character === '\n' ||
      character === '\r'
    ) {
      const match = /^[\s]+/.exec(code.slice(index));
      if (match) {
        tokens.push({ type: 'plain', value: match[0] });
        index += match[0].length;
        continue;
      }
    }

    if (character === '{' || character === '[') {
      tokens.push({ type: 'punct', value: character });
      lastWas = 'open';
      index++;
      continue;
    }

    if (character === '}' || character === ']') {
      tokens.push({ type: 'punct', value: character });
      lastWas = 'value';
      index++;
      continue;
    }

    if (character === ':') {
      tokens.push({ type: 'punct', value: character });
      lastWas = 'colon';
      index++;
      continue;
    }

    if (character === ',') {
      tokens.push({ type: 'punct', value: character });
      lastWas = 'comma';
      index++;
      continue;
    }

    if (character === '"') {
      const match = /^"(?:\\.|[^"\\])*"/.exec(code.slice(index));
      if (match) {
        const isValue = lastWas === 'colon';
        tokens.push({
          type: isValue ? 'tx-source' : 'string',
          value: match[0],
        });
        lastWas = 'value';
        index += match[0].length;
        continue;
      }
    }

    if (/[0-9-]/.test(character)) {
      const match = /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(code.slice(index));
      if (match) {
        tokens.push({ type: 'number', value: match[0] });
        lastWas = 'value';
        index += match[0].length;
        continue;
      }
    }

    if (/[a-z]/.test(character)) {
      const match = /^(true|false|null)\b/.exec(code.slice(index));
      if (match) {
        tokens.push({ type: 'literal', value: match[0] });
        lastWas = 'value';
        index += match[0].length;
        continue;
      }
    }

    tokens.push({ type: 'plain', value: character });
    index++;
  }

  return mergePlainTokens(tokens);
}

interface ScanResult {
  end: number;
  token: Token;
}

function scanToken(
  code: string,
  index: number,
  _language: Language,
): ScanResult | null {
  const character = code[index];
  if (character === undefined) {
    return null;
  }

  if (
    character === ' ' ||
    character === '\t' ||
    character === '\n' ||
    character === '\r'
  ) {
    const match = /^[\s]+/.exec(code.slice(index));
    if (match) {
      return {
        end: index + match[0].length,
        token: { type: 'plain', value: match[0] },
      };
    }
  }

  if (character === '/' && code[index + 1] === '/') {
    const newline = code.indexOf('\n', index);
    const value =
      newline === -1 ? code.slice(index) : code.slice(index, newline);
    return { end: index + value.length, token: { type: 'comment', value } };
  }

  if (character === '/' && code[index + 1] === '*') {
    const close = code.indexOf('*/', index + 2);
    const end = close === -1 ? code.length : close + 2;
    return { end, token: { type: 'comment', value: code.slice(index, end) } };
  }

  if (character === "'" || character === '"') {
    const re =
      character === "'" ? /^'(?:\\.|[^'\\\n])*'/ : /^"(?:\\.|[^"\\\n])*"/;
    const match = re.exec(code.slice(index));
    if (match) {
      return {
        end: index + match[0].length,
        token: { type: 'string', value: match[0] },
      };
    }
  }

  if (character === '`') {
    const match = /^`(?:\\.|[^`\\])*`/.exec(code.slice(index));
    if (match) {
      return {
        end: index + match[0].length,
        token: { type: 'template', value: match[0] },
      };
    }
  }

  if (character === '<') {
    const match = /^<\/?[A-Za-z][\w.-]*/.exec(code.slice(index));
    if (match) {
      return {
        end: index + match[0].length,
        token: { type: 'jsx-tag', value: match[0] },
      };
    }
  }

  if (character === '/' && code[index + 1] === '>') {
    return { end: index + 2, token: { type: 'jsx-tag', value: '/>' } };
  }

  if (character >= '0' && character <= '9') {
    const match = /^\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(code.slice(index));
    if (match) {
      return {
        end: index + match[0].length,
        token: { type: 'number', value: match[0] },
      };
    }
  }

  if (/[A-Za-z_$]/.test(character)) {
    const match = /^[A-Za-z_$][\w$]*/.exec(code.slice(index));
    if (match) {
      const value = match[0];
      let type: TokenType = 'plain';
      if (KEYWORDS.has(value)) {
        type = 'keyword';
      } else if (LITERALS.has(value)) {
        type = 'literal';
      } else if (BUILTIN_TYPES.has(value)) {
        type = 'type';
      } else if (code[index + value.length] === '(') {
        type = 'fn-call';
      }
      return { end: index + value.length, token: { type, value } };
    }
  }

  if (/[{}()[\];,.:?!<>=+\-*/%&|^~]/.test(character)) {
    return { end: index + 1, token: { type: 'punct', value: character } };
  }

  return null;
}

function applyYapyakHighlight(tokens: Token[]) {
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token === undefined) {
      continue;
    }

    if (token.type === 'string' && YAPYAK_STRING.test(token.value)) {
      token.type = 'tx-yapyak';
      continue;
    }

    if (
      (token.type === 'fn-call' || token.type === 'plain') &&
      token.value === 't'
    ) {
      const next = findNextSignificant(tokens, index + 1);
      if (
        next !== null &&
        tokens[next]?.type === 'punct' &&
        tokens[next]?.value === '('
      ) {
        const arg = findNextSignificant(tokens, next + 1);
        if (arg !== null) {
          const argToken = tokens[arg];
          if (
            argToken !== undefined &&
            (argToken.type === 'string' || argToken.type === 'template')
          ) {
            token.type = 'tx-call';
            argToken.type = 'tx-source';
          }
        }
      }
    }

    if (token.type === 'fn-call' && token.value === '_$pick') {
      const openParen = findNextSignificant(tokens, index + 1);
      if (
        openParen !== null &&
        tokens[openParen]?.type === 'punct' &&
        tokens[openParen]?.value === '('
      ) {
        let depth = 1;
        let cursor = openParen + 1;
        while (cursor < tokens.length && depth > 0) {
          const inner = tokens[cursor];
          if (inner === undefined) {
            break;
          }
          if (inner.type === 'punct') {
            if (inner.value === '(') {
              depth++;
            } else if (inner.value === ')') {
              depth--;
            }
          }
          if (inner.type === 'string' || inner.type === 'template') {
            inner.type = 'tx-source';
          }
          cursor++;
        }
      }
    }
  }
}

function reclassifyJsxText(tokens: Token[]) {
  let depth = 0;
  let inText = false;
  let exprDepth = 0;

  for (const token of tokens) {
    if (token.type === 'jsx-tag') {
      inText = false;
      if (token.value === '/>') {
        depth = Math.max(0, depth - 1);
        if (depth > 0 && exprDepth === 0) {
          inText = true;
        }
      } else if (token.value.startsWith('</')) {
        depth = Math.max(0, depth - 1);
      } else {
        depth++;
      }
      continue;
    }

    if (token.type === 'punct') {
      const value = token.value;
      if (value === '>') {
        if (depth > 0 && exprDepth === 0) {
          inText = true;
        }
        continue;
      }
      if (value === '<') {
        inText = false;
        continue;
      }
      if (value === '{' && inText) {
        exprDepth++;
        inText = false;
        continue;
      }
      if (value === '}' && exprDepth > 0) {
        exprDepth--;
        if (exprDepth === 0 && depth > 0) {
          inText = true;
        }
        continue;
      }
    }

    if (inText) {
      if (
        token.type === 'keyword' ||
        token.type === 'literal' ||
        token.type === 'type' ||
        token.type === 'fn-call'
      ) {
        token.type = 'plain';
      }
    }
  }
}

function findNextSignificant(tokens: Token[], from: number) {
  for (let index = from; index < tokens.length; index++) {
    const token = tokens[index];
    if (token === undefined) {
      continue;
    }
    if (token.type === 'plain' && /^\s*$/.test(token.value)) {
      continue;
    }
    return index;
  }
  return null;
}

function mergePlainTokens(tokens: Token[]) {
  const result: Token[] = [];
  for (const token of tokens) {
    const previous = result[result.length - 1];
    if (
      previous !== undefined &&
      previous.type === 'plain' &&
      token.type === 'plain'
    ) {
      previous.value += token.value;
    } else {
      result.push({ ...token });
    }
  }
  return result;
}
