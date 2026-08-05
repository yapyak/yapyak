import type { Language, Token, TokenKind } from './type';

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

const LITERALS = new Set([
  'true',
  'false',
  'null',
  'undefined',
]);

const JSX_LANGUAGES = new Set<Language>([
  'tsx',
  'jsx',
  'svelte',
  'vue',
  'astro',
  'html',
]);

const REGEX_PREV_PUNCT_RX = /^(?:[(,=;:[{!&|?~^%]|=>)$/;
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

type ScanResult = {
  end: number;
  token: Token;
};

export function scanToken(
  code: string,
  index: number,
  language: Language,
  previous: Token | undefined,
): ScanResult | undefined {
  const character = code[index];
  if (character === undefined) {
    return undefined;
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
        token: {
          kind: 'plain',
          value: match[0],
        },
      };
    }
  }

  if (character === '/' && code[index + 1] === '/') {
    const newline = code.indexOf('\n', index);
    const value =
      newline === -1 ? code.slice(index) : code.slice(index, newline);
    return {
      end: index + value.length,
      token: {
        kind: 'comment',
        value,
      },
    };
  }

  if (character === '/' && code[index + 1] === '*') {
    const close = code.indexOf('*/', index + 2);
    const end = close === -1 ? code.length : close + 2;
    return {
      end,
      token: {
        kind: 'comment',
        value: code.slice(index, end),
      },
    };
  }

  if (character === '/' && isRegexContext(previous)) {
    const match = /^\/(?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^/\\\n])+\/[gimsuy]*/.exec(
      code.slice(index),
    );
    if (match) {
      return {
        end: index + match[0].length,
        token: {
          kind: 'regex',
          value: match[0],
        },
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
        token: {
          kind: 'string',
          value: match[0],
        },
      };
    }
  }

  if (character === '`') {
    const match = /^`(?:\\.|[^`\\])*`/.exec(code.slice(index));
    if (match) {
      return {
        end: index + match[0].length,
        token: {
          kind: 'template',
          value: match[0],
        },
      };
    }
  }

  if (character === '<' && JSX_LANGUAGES.has(language)) {
    const match = /^<\/?[A-Za-z][\w.-]*/.exec(code.slice(index));
    if (match) {
      return {
        end: index + match[0].length,
        token: {
          kind: 'jsx-tag',
          value: match[0],
        },
      };
    }
  }

  if (
    character === '/' &&
    code[index + 1] === '>' &&
    JSX_LANGUAGES.has(language)
  ) {
    return {
      end: index + 2,
      token: {
        kind: 'jsx-tag',
        value: '/>',
      },
    };
  }

  if (character >= '0' && character <= '9') {
    const tail = code.slice(index);
    const hex = /^0[xX][\da-fA-F](?:_?[\da-fA-F])*n?/.exec(tail);
    if (hex) {
      return {
        end: index + hex[0].length,
        token: {
          kind: 'number',
          value: hex[0],
        },
      };
    }
    const bin = /^0[bB][01](?:_?[01])*n?/.exec(tail);
    if (bin) {
      return {
        end: index + bin[0].length,
        token: {
          kind: 'number',
          value: bin[0],
        },
      };
    }
    const oct = /^0[oO][0-7](?:_?[0-7])*n?/.exec(tail);
    if (oct) {
      return {
        end: index + oct[0].length,
        token: {
          kind: 'number',
          value: oct[0],
        },
      };
    }
    const decimal =
      /^\d(?:_?\d)*(?:\.\d(?:_?\d)*)?(?:[eE][+-]?\d(?:_?\d)*)?n?/.exec(tail);
    if (decimal) {
      return {
        end: index + decimal[0].length,
        token: {
          kind: 'number',
          value: decimal[0],
        },
      };
    }
  }

  if (character === '.' && code[index + 1] === '.' && code[index + 2] === '.') {
    return {
      end: index + 3,
      token: {
        kind: 'spread',
        value: '...',
      },
    };
  }

  if (character === '@') {
    const match = /^@[A-Za-z_][\w$]*/.exec(code.slice(index));
    if (match) {
      return {
        end: index + match[0].length,
        token: {
          kind: 'decorator',
          value: match[0],
        },
      };
    }
  }

  if (/[A-Za-z_$]/.test(character)) {
    const match = /^[A-Za-z_$][\w$]*/.exec(code.slice(index));
    if (match) {
      const value = match[0];
      const next = code[index + value.length];
      const isMemberAccess =
        previous?.kind === 'punct' && previous.value === '.';
      const isObjectPropertyKey =
        next === ':' &&
        previous?.kind === 'punct' &&
        (previous.value === '{' || previous.value === ',');
      const isContextualPlain = isMemberAccess || isObjectPropertyKey;
      let kind: TokenKind = 'plain';
      if (!isContextualPlain && KEYWORDS.has(value)) {
        kind = 'keyword';
      } else if (!isContextualPlain && LITERALS.has(value)) {
        kind = 'literal';
      } else if (!isContextualPlain && BUILTIN_TYPES.has(value)) {
        kind = 'type';
      } else if (next === '(') {
        kind = 'fn-call';
      }
      return {
        end: index + value.length,
        token: {
          kind,
          value,
        },
      };
    }
  }

  if (/[{}()[\];,.:?!<>=+\-*/%&|^~]/.test(character)) {
    return {
      end: index + 1,
      token: {
        kind: 'punct',
        value: character,
      },
    };
  }

  return undefined;
}

function isRegexContext(previous: Token | undefined): boolean {
  if (previous === undefined) {
    return true;
  }
  if (previous.kind === 'punct' && REGEX_PREV_PUNCT_RX.test(previous.value)) {
    return true;
  }
  if (previous.kind === 'keyword' && REGEX_PREV_KEYWORDS.has(previous.value)) {
    return true;
  }
  return false;
}
