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
  | 'yaml'
  | 'translation';

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
  | 'jsx-brace'
  | 'punct'
  | 'spread'
  | 'regex'
  | 'decorator'
  | 'tx-call'
  | 'tx-source'
  | 'tx-yapyak'
  | 'diff-add'
  | 'diff-remove'
  | 'diff-hunk'
  | 'bash-var'
  | 'bash-flag'
  | 'bash-subcommand'
  | 'bash-package';

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

const TYPE_KEYWORDS = new Set([
  'as',
  'extends',
  'implements',
  'keyof',
  'typeof',
  'infer',
  'is',
  'in',
  'type',
  'interface',
]);

const YAPYAK_STRING = /^(["'`])yapyak(?:\/[\w-]+)*\1$/;

const DOTTED_KEY_PATTERN = /^[a-zA-Z_][\w]*(?:\.[a-zA-Z_][\w]*)+$/;

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
  if (language === 'translation') {
    return tokenizeTranslation(code);
  }
  const tokens: Token[] = [];
  let index = 0;
  let lastSignificant: Token | undefined;
  while (index < code.length) {
    const result = scanToken(code, index, language, lastSignificant);
    if (result === null) {
      const fallback: Token = { type: 'plain', value: code[index] ?? '' };
      tokens.push(fallback);
      if (!/^\s+$/.test(fallback.value)) {
        lastSignificant = fallback;
      }
      index++;
    } else {
      tokens.push(result.token);
      if (result.token.type !== 'plain' || !/^\s+$/.test(result.token.value)) {
        lastSignificant = result.token;
      }
      index = result.end;
    }
  }
  applyYapyakHighlight(tokens);
  applyTypePositions(tokens);
  markTaggedTemplates(tokens);
  reclassifyJsxText(tokens);
  const vueExpanded =
    language === 'vue' ? expandVueAttributeBindings(tokens) : tokens;
  const templateExpanded = expandTemplateInterpolations(vueExpanded, language);
  return mergePlainTokens(templateExpanded);
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

const SUBCOMMAND_TOOLS = new Set([
  'npm',
  'pnpm',
  'yarn',
  'bun',
  'npx',
  'pnpx',
  'git',
  'yapyak',
  'docker',
  'kubectl',
]);

function tokenizeBash(code: string) {
  const tokens: Token[] = [];
  let index = 0;
  let atLineStart = true;
  let expectSubcommand = false;
  let inArgs = false;
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
          expectSubcommand = false;
          inArgs = false;
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
        if (SUBCOMMAND_TOOLS.has(match[0])) {
          expectSubcommand = true;
        }
        index += match[0].length;
        continue;
      }
    }

    if (expectSubcommand && /[A-Za-z_]/.test(character)) {
      const match = /^[A-Za-z_][\w-]*/.exec(code.slice(index));
      if (match) {
        tokens.push({ type: 'bash-subcommand', value: match[0] });
        expectSubcommand = false;
        inArgs = true;
        index += match[0].length;
        continue;
      }
    }

    if (inArgs && /[@A-Za-z_]/.test(character)) {
      const match = /^@?[\w][\w./@-]*/.exec(code.slice(index));
      if (match) {
        tokens.push({ type: 'bash-package', value: match[0] });
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

const LOCALE_PREFIX = /^([a-z]{2,3}(?:-[a-z]{2})?:[ \t]+)(.*)$/;

function tokenizeTranslation(code: string): Token[] {
  const tokens: Token[] = [];
  const lines = code.split('\n');

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index] ?? '';
    const trailing = index < lines.length - 1 ? '\n' : '';

    if (line.length > 0) {
      const match = LOCALE_PREFIX.exec(line);
      if (match) {
        const prefix = match[1] ?? '';
        const content = match[2] ?? '';
        tokens.push({ type: 'comment', value: prefix });
        if (content.length > 0) {
          tokens.push({ type: 'tx-source', value: content });
        }
      } else {
        tokens.push({ type: 'tx-source', value: line });
      }
    }

    if (trailing.length > 0) {
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

const JSX_LANGUAGES = new Set<Language>([
  'tsx',
  'jsx',
  'svelte',
  'vue',
  'astro',
  'html',
]);

const REGEX_PREV_PUNCT = /^(?:[(,=;:[{!&|?~^%]|=>)$/;
const REGEX_PREV_KEYWORDS = new Set([
  'return',
  'typeof',
  'in',
  'of',
  'new',
  'throw',
  'await',
  'yield',
  'case',
  'delete',
  'void',
  'instanceof',
]);

function isRegexContext(previous: Token | undefined): boolean {
  if (previous === undefined) {
    return true;
  }
  if (previous.type === 'punct' && REGEX_PREV_PUNCT.test(previous.value)) {
    return true;
  }
  if (previous.type === 'keyword' && REGEX_PREV_KEYWORDS.has(previous.value)) {
    return true;
  }
  return false;
}

function scanToken(
  code: string,
  index: number,
  language: Language,
  previous: Token | undefined,
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

  if (character === '/' && isRegexContext(previous)) {
    const match = /^\/(?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^/\\\n])+\/[gimsuy]*/.exec(
      code.slice(index),
    );
    if (match) {
      return {
        end: index + match[0].length,
        token: { type: 'regex', value: match[0] },
      };
    }
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

  if (character === '<' && JSX_LANGUAGES.has(language)) {
    const match = /^<\/?[A-Za-z][\w.-]*/.exec(code.slice(index));
    if (match) {
      return {
        end: index + match[0].length,
        token: { type: 'jsx-tag', value: match[0] },
      };
    }
  }

  if (
    character === '/' &&
    code[index + 1] === '>' &&
    JSX_LANGUAGES.has(language)
  ) {
    return { end: index + 2, token: { type: 'jsx-tag', value: '/>' } };
  }

  if (character >= '0' && character <= '9') {
    const tail = code.slice(index);
    const hex = /^0[xX][\da-fA-F](?:_?[\da-fA-F])*n?/.exec(tail);
    if (hex) {
      return {
        end: index + hex[0].length,
        token: { type: 'number', value: hex[0] },
      };
    }
    const bin = /^0[bB][01](?:_?[01])*n?/.exec(tail);
    if (bin) {
      return {
        end: index + bin[0].length,
        token: { type: 'number', value: bin[0] },
      };
    }
    const oct = /^0[oO][0-7](?:_?[0-7])*n?/.exec(tail);
    if (oct) {
      return {
        end: index + oct[0].length,
        token: { type: 'number', value: oct[0] },
      };
    }
    const decimal =
      /^\d(?:_?\d)*(?:\.\d(?:_?\d)*)?(?:[eE][+-]?\d(?:_?\d)*)?n?/.exec(tail);
    if (decimal) {
      return {
        end: index + decimal[0].length,
        token: { type: 'number', value: decimal[0] },
      };
    }
  }

  if (character === '.' && code[index + 1] === '.' && code[index + 2] === '.') {
    return { end: index + 3, token: { type: 'spread', value: '...' } };
  }

  if (character === '@') {
    const match = /^@[A-Za-z_][\w$]*/.exec(code.slice(index));
    if (match) {
      return {
        end: index + match[0].length,
        token: { type: 'decorator', value: match[0] },
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
      if (next === null) {
        continue;
      }

      // Case 1: t('source')
      if (tokens[next]?.type === 'punct' && tokens[next]?.value === '(') {
        const arg = findNextSignificant(tokens, next + 1);
        if (arg !== null) {
          const argToken = tokens[arg];
          if (
            argToken !== undefined &&
            (argToken.type === 'string' || argToken.type === 'template') &&
            !isDottedKey(argToken.value)
          ) {
            token.type = 'tx-call';
            argToken.type = 'tx-source';
          }
        }
        continue;
      }

      // Case 2: t.at('context', 'source') or t.in('locale', 'source')
      if (tokens[next]?.type === 'punct' && tokens[next]?.value === '.') {
        const method = findNextSignificant(tokens, next + 1);
        if (method === null) {
          continue;
        }
        const methodValue = tokens[method]?.value;
        if (methodValue !== 'at' && methodValue !== 'in') {
          continue;
        }
        const paren = findNextSignificant(tokens, method + 1);
        if (
          paren === null ||
          tokens[paren]?.type !== 'punct' ||
          tokens[paren]?.value !== '('
        ) {
          continue;
        }
        const firstArg = findNextSignificant(tokens, paren + 1);
        if (firstArg === null) {
          continue;
        }
        const comma = findTopLevelComma(tokens, firstArg + 1);
        if (comma === null) {
          continue;
        }
        const secondArg = findNextSignificant(tokens, comma + 1);
        if (secondArg === null) {
          continue;
        }
        const secondToken = tokens[secondArg];
        if (
          secondToken !== undefined &&
          (secondToken.type === 'string' || secondToken.type === 'template') &&
          !isDottedKey(secondToken.value)
        ) {
          secondToken.type = 'tx-source';
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

function markTaggedTemplates(tokens: Token[]) {
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token === undefined || token.type !== 'template') {
      continue;
    }
    let cursor = index - 1;
    while (cursor >= 0) {
      const previous = tokens[cursor];
      if (previous === undefined) {
        break;
      }
      if (previous.type === 'plain' && /^\s+$/.test(previous.value)) {
        break;
      }
      if (
        previous.type === 'plain' ||
        previous.type === 'fn-call' ||
        previous.type === 'type'
      ) {
        previous.type = 'fn-call';
        cursor--;
        continue;
      }
      if (previous.type === 'punct' && previous.value === '.') {
        cursor--;
        continue;
      }
      break;
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
        token.type = 'jsx-brace';
        continue;
      }
      if (value === '}' && exprDepth > 0) {
        const wasOutermost = exprDepth === 1;
        exprDepth--;
        if (exprDepth === 0 && depth > 0) {
          inText = true;
        }
        if (wasOutermost && depth > 0) {
          token.type = 'jsx-brace';
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

function isDottedKey(value: string): boolean {
  const inner = value.slice(1, -1);
  return DOTTED_KEY_PATTERN.test(inner);
}

function expandVueAttributeBindings(tokens: Token[]): Token[] {
  const result: Token[] = [];
  let index = 0;

  while (index < tokens.length) {
    const token = tokens[index];
    if (token === undefined) {
      index++;
      continue;
    }

    if (
      token.type === 'punct' &&
      (token.value === ':' || token.value === '@')
    ) {
      const identIndex = findNextNonWhitespace(tokens, index + 1);
      if (identIndex !== -1) {
        const ident = tokens[identIndex];
        if (
          ident !== undefined &&
          (ident.type === 'fn-call' ||
            ident.type === 'plain' ||
            ident.type === 'keyword')
        ) {
          const equalsIndex = findNextNonWhitespace(tokens, identIndex + 1);
          if (equalsIndex !== -1) {
            const equals = tokens[equalsIndex];
            if (equals?.type === 'punct' && equals.value === '=') {
              const stringIndex = findNextNonWhitespace(
                tokens,
                equalsIndex + 1,
              );
              if (stringIndex !== -1) {
                const str = tokens[stringIndex];
                if (str?.type === 'string' && str.value.length >= 2) {
                  for (let cursor = index; cursor < stringIndex; cursor++) {
                    const passthrough = tokens[cursor];
                    if (passthrough !== undefined) {
                      result.push(passthrough);
                    }
                  }
                  const quote = str.value[0] ?? '"';
                  const inner = str.value.slice(1, -1);
                  const innerTokens = tokenize(inner, 'ts');
                  result.push({ type: 'string', value: quote });
                  for (const innerToken of innerTokens) {
                    result.push(innerToken);
                  }
                  result.push({ type: 'string', value: quote });
                  index = stringIndex + 1;
                  continue;
                }
              }
            }
          }
        }
      }
    }

    result.push(token);
    index++;
  }

  return result;
}

function expandTemplateInterpolations(
  tokens: Token[],
  language: Language,
): Token[] {
  const result: Token[] = [];

  for (const token of tokens) {
    if (token.type !== 'template') {
      result.push(token);
      continue;
    }

    const value = token.value;
    if (
      value.length < 2 ||
      value[0] !== '`' ||
      value[value.length - 1] !== '`'
    ) {
      result.push(token);
      continue;
    }

    const body = value.slice(1, -1);
    const segments: Token[] = [];
    let lastEnd = 0;
    let cursor = 0;
    let hasInterpolation = false;

    while (cursor < body.length) {
      if (body[cursor] === '\\') {
        cursor += 2;
        continue;
      }
      if (body[cursor] === '$' && body[cursor + 1] === '{') {
        hasInterpolation = true;
        if (cursor > lastEnd) {
          segments.push({
            type: 'template',
            value: body.slice(lastEnd, cursor),
          });
        }
        let depth = 1;
        let end = cursor + 2;
        while (end < body.length && depth > 0) {
          if (body[end] === '\\') {
            end += 2;
            continue;
          }
          if (body[end] === '{') {
            depth++;
          } else if (body[end] === '}') {
            depth--;
            if (depth === 0) {
              break;
            }
          }
          end++;
        }
        segments.push({ type: 'punct', value: '${' });
        const inner = body.slice(cursor + 2, end);
        for (const innerToken of tokenize(inner, language)) {
          segments.push(innerToken);
        }
        segments.push({ type: 'punct', value: '}' });
        cursor = end + 1;
        lastEnd = cursor;
        continue;
      }
      cursor++;
    }

    if (!hasInterpolation) {
      result.push(token);
      continue;
    }

    if (lastEnd < body.length) {
      segments.push({ type: 'template', value: body.slice(lastEnd) });
    }

    result.push({ type: 'template', value: '`' });
    for (const segment of segments) {
      result.push(segment);
    }
    result.push({ type: 'template', value: '`' });
  }

  return result;
}

function findNextNonWhitespace(tokens: Token[], from: number): number {
  for (let index = from; index < tokens.length; index++) {
    const token = tokens[index];
    if (token === undefined) {
      continue;
    }
    if (token.type === 'plain' && /^\s+$/.test(token.value)) {
      continue;
    }
    return index;
  }
  return -1;
}

function findTopLevelComma(tokens: Token[], from: number): number | null {
  let depth = 0;
  for (let index = from; index < tokens.length; index++) {
    const token = tokens[index];
    if (token === undefined) {
      continue;
    }
    if (token.type === 'punct') {
      if (token.value === '(' || token.value === '[' || token.value === '{') {
        depth++;
        continue;
      }
      if (token.value === ')' || token.value === ']' || token.value === '}') {
        if (depth === 0) {
          return null;
        }
        depth--;
        continue;
      }
      if (token.value === ',' && depth === 0) {
        return index;
      }
    }
  }
  return null;
}

function applyTypePositions(tokens: Token[]) {
  let genericDepth = 0;

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token === undefined) {
      continue;
    }

    if (token.type === 'punct' && token.value === '<') {
      const previousIndex = findPreviousSignificant(tokens, index - 1);
      const previous =
        previousIndex === null ? undefined : tokens[previousIndex];
      const isGenericOpen =
        previous !== undefined &&
        (previous.type === 'type' ||
          previous.type === 'fn-call' ||
          (previous.type === 'plain' && /^[A-Z][\w$]*$/.test(previous.value)));
      if (isGenericOpen) {
        genericDepth++;
      }
    } else if (
      token.type === 'punct' &&
      token.value === '>' &&
      genericDepth > 0
    ) {
      genericDepth--;
    }

    if (token.type !== 'plain' && token.type !== 'fn-call') {
      continue;
    }
    if (!/^[A-Z][\w$]*$/.test(token.value)) {
      continue;
    }

    if (genericDepth > 0) {
      token.type = 'type';
      continue;
    }

    const previousIndex = findPreviousSignificant(tokens, index - 1);
    if (previousIndex === null) {
      continue;
    }
    const previous = tokens[previousIndex];
    if (previous === undefined) {
      continue;
    }

    const isTriggered =
      (previous.type === 'punct' && /^[:<|&?]$/.test(previous.value)) ||
      (previous.type === 'keyword' && TYPE_KEYWORDS.has(previous.value));

    if (isTriggered) {
      token.type = 'type';
      continue;
    }

    const nextIndex = findNextSignificant(tokens, index + 1);
    if (nextIndex !== null) {
      const next = tokens[nextIndex];
      if (next?.type === 'keyword' && next.value === 'in') {
        token.type = 'type';
      }
    }
  }
}

function findPreviousSignificant(tokens: Token[], from: number) {
  for (let index = from; index >= 0; index--) {
    const token = tokens[index];
    if (token === undefined) {
      continue;
    }
    if (token.type === 'plain' && /^\s*$/.test(token.value)) {
      continue;
    }
    if (token.type === 'comment') {
      continue;
    }
    return index;
  }
  return null;
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
