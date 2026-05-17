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
  const tokens: Token[] = [];
  let i = 0;
  while (i < code.length) {
    const result = scanToken(code, i, language);
    if (result === null) {
      tokens.push({ type: 'plain', value: code[i] ?? '' });
      i++;
    } else {
      tokens.push(result.token);
      i = result.end;
    }
  }
  applyYapyakHighlight(tokens);
  return mergePlainTokens(tokens);
}

function tokenizeDiff(code: string): Token[] {
  const tokens: Token[] = [];
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const trailing = i < lines.length - 1 ? '\n' : '';
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

function tokenizeBash(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let atLineStart = true;
  while (i < code.length) {
    const c = code[i] ?? '';

    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      const match = /^[\s]+/.exec(code.slice(i));
      if (match) {
        tokens.push({ type: 'plain', value: match[0] });
        if (match[0].includes('\n')) {
          atLineStart = true;
        }
        i += match[0].length;
        continue;
      }
    }

    if (c === '#') {
      const newline = code.indexOf('\n', i);
      const value = newline === -1 ? code.slice(i) : code.slice(i, newline);
      tokens.push({ type: 'comment', value });
      i += value.length;
      continue;
    }

    if (c === "'" || c === '"') {
      const re = c === "'" ? /^'(?:\\.|[^'\\])*'/ : /^"(?:\\.|[^"\\])*"/;
      const match = re.exec(code.slice(i));
      if (match) {
        tokens.push({ type: 'string', value: match[0] });
        i += match[0].length;
        continue;
      }
    }

    if (c === '$') {
      const braced = /^\$\{[^}]+\}/.exec(code.slice(i));
      if (braced) {
        tokens.push({ type: 'bash-var', value: braced[0] });
        i += braced[0].length;
        continue;
      }
      const plain = /^\$[A-Za-z_][\w]*/.exec(code.slice(i));
      if (plain) {
        tokens.push({ type: 'bash-var', value: plain[0] });
        i += plain[0].length;
        continue;
      }
    }

    if (c === '-') {
      const flag = /^--?[A-Za-z][\w-]*/.exec(code.slice(i));
      if (flag) {
        tokens.push({ type: 'bash-flag', value: flag[0] });
        i += flag[0].length;
        continue;
      }
    }

    if (c >= '0' && c <= '9') {
      const match = /^\d+(?:\.\d+)?/.exec(code.slice(i));
      if (match) {
        tokens.push({ type: 'number', value: match[0] });
        i += match[0].length;
        continue;
      }
    }

    if (atLineStart && /[A-Za-z_]/.test(c)) {
      const match = /^[A-Za-z_][\w-]*/.exec(code.slice(i));
      if (match) {
        tokens.push({ type: 'fn-call', value: match[0] });
        atLineStart = false;
        i += match[0].length;
        continue;
      }
    }

    if (c !== '\n') {
      atLineStart = false;
    }
    tokens.push({ type: 'plain', value: c });
    i++;
  }
  return mergePlainTokens(tokens);
}

function tokenizeHtml(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let mode: 'text' | 'tag' = 'text';

  while (i < code.length) {
    if (mode === 'text') {
      if (code.startsWith('<!--', i)) {
        const end = code.indexOf('-->', i + 4);
        const stop = end === -1 ? code.length : end + 3;
        tokens.push({ type: 'comment', value: code.slice(i, stop) });
        i = stop;
        continue;
      }

      if (code[i] === '<') {
        const match = /^<\/?[A-Za-z][\w.-]*/.exec(code.slice(i));
        if (match) {
          tokens.push({ type: 'jsx-tag', value: match[0] });
          i += match[0].length;
          mode = 'tag';
          continue;
        }
      }

      const nextOpen = code.indexOf('<', i);
      const stop = nextOpen === -1 ? code.length : nextOpen;
      tokens.push({ type: 'plain', value: code.slice(i, stop) });
      i = stop;
      continue;
    }

    if (code[i] === '/' && code[i + 1] === '>') {
      tokens.push({ type: 'jsx-tag', value: '/>' });
      i += 2;
      mode = 'text';
      continue;
    }

    if (code[i] === '>') {
      tokens.push({ type: 'jsx-tag', value: '>' });
      i++;
      mode = 'text';
      continue;
    }

    const whitespace = /^[\s]+/.exec(code.slice(i));
    if (whitespace) {
      tokens.push({ type: 'plain', value: whitespace[0] });
      i += whitespace[0].length;
      continue;
    }

    if (code[i] === '=') {
      tokens.push({ type: 'punct', value: '=' });
      i++;
      continue;
    }

    if (code[i] === '"' || code[i] === "'") {
      const quote = code[i];
      const regex = quote === "'" ? /^'(?:\\.|[^'\\])*'/ : /^"(?:\\.|[^"\\])*"/;
      const match = regex.exec(code.slice(i));
      if (match) {
        tokens.push({ type: 'string', value: match[0] });
        i += match[0].length;
        continue;
      }
    }

    const attribute = /^[A-Za-z_:@][\w:.-]*/.exec(code.slice(i));
    if (attribute) {
      tokens.push({ type: 'fn-call', value: attribute[0] });
      i += attribute[0].length;
      continue;
    }

    tokens.push({ type: 'plain', value: code[i] ?? '' });
    i++;
  }

  return mergePlainTokens(tokens);
}

function tokenizeYaml(code: string): Token[] {
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

interface ScanResult {
  end: number;
  token: Token;
}

function scanToken(
  code: string,
  i: number,
  _language: Language,
): ScanResult | null {
  const c = code[i];
  if (c === undefined) {
    return null;
  }

  if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
    const match = /^[\s]+/.exec(code.slice(i));
    if (match) {
      return {
        end: i + match[0].length,
        token: { type: 'plain', value: match[0] },
      };
    }
  }

  if (c === '/' && code[i + 1] === '/') {
    const newline = code.indexOf('\n', i);
    const value = newline === -1 ? code.slice(i) : code.slice(i, newline);
    return { end: i + value.length, token: { type: 'comment', value } };
  }

  if (c === '/' && code[i + 1] === '*') {
    const close = code.indexOf('*/', i + 2);
    const end = close === -1 ? code.length : close + 2;
    return { end, token: { type: 'comment', value: code.slice(i, end) } };
  }

  if (c === "'" || c === '"') {
    const re = c === "'" ? /^'(?:\\.|[^'\\\n])*'/ : /^"(?:\\.|[^"\\\n])*"/;
    const match = re.exec(code.slice(i));
    if (match) {
      return {
        end: i + match[0].length,
        token: { type: 'string', value: match[0] },
      };
    }
  }

  if (c === '`') {
    const match = /^`(?:\\.|[^`\\])*`/.exec(code.slice(i));
    if (match) {
      return {
        end: i + match[0].length,
        token: { type: 'template', value: match[0] },
      };
    }
  }

  if (c === '<') {
    const match = /^<\/?[A-Za-z][\w.-]*/.exec(code.slice(i));
    if (match) {
      return {
        end: i + match[0].length,
        token: { type: 'jsx-tag', value: match[0] },
      };
    }
  }

  if (c === '/' && code[i + 1] === '>') {
    return { end: i + 2, token: { type: 'jsx-tag', value: '/>' } };
  }

  if (c >= '0' && c <= '9') {
    const match = /^\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(code.slice(i));
    if (match) {
      return {
        end: i + match[0].length,
        token: { type: 'number', value: match[0] },
      };
    }
  }

  if (/[A-Za-z_$]/.test(c)) {
    const match = /^[A-Za-z_$][\w$]*/.exec(code.slice(i));
    if (match) {
      const value = match[0];
      let type: TokenType = 'plain';
      if (KEYWORDS.has(value)) {
        type = 'keyword';
      } else if (LITERALS.has(value)) {
        type = 'literal';
      } else if (BUILTIN_TYPES.has(value)) {
        type = 'type';
      } else if (code[i + value.length] === '(') {
        type = 'fn-call';
      }
      return { end: i + value.length, token: { type, value } };
    }
  }

  if (/[{}()[\];,.:?!<>=+\-*/%&|^~]/.test(c)) {
    return { end: i + 1, token: { type: 'punct', value: c } };
  }

  return null;
}

function applyYapyakHighlight(tokens: Token[]): void {
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

function findNextSignificant(tokens: Token[], from: number): number | null {
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

function mergePlainTokens(tokens: Token[]): Token[] {
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
