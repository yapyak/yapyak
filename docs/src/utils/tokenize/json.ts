import type { Token } from './type';

import { mergePlainTokens } from './plain-token';

export function tokenizeJson(code: string): Token[] {
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
        tokens.push({
          kind: 'plain',
          value: match[0],
        });
        index += match[0].length;
        continue;
      }
    }

    if (character === '{' || character === '[') {
      tokens.push({
        kind: 'punct',
        value: character,
      });
      lastWas = 'open';
      index++;
      continue;
    }

    if (character === '}' || character === ']') {
      tokens.push({
        kind: 'punct',
        value: character,
      });
      lastWas = 'value';
      index++;
      continue;
    }

    if (character === ':') {
      tokens.push({
        kind: 'punct',
        value: character,
      });
      lastWas = 'colon';
      index++;
      continue;
    }

    if (character === ',') {
      tokens.push({
        kind: 'punct',
        value: character,
      });
      lastWas = 'comma';
      index++;
      continue;
    }

    if (character === '"') {
      const match = /^"(?:\\.|[^"\\])*"/.exec(code.slice(index));
      if (match) {
        const isValue = lastWas === 'colon';
        tokens.push({
          kind: isValue ? 'tx-source' : 'string',
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
        tokens.push({
          kind: 'number',
          value: match[0],
        });
        lastWas = 'value';
        index += match[0].length;
        continue;
      }
    }

    if (/[a-z]/.test(character)) {
      const match = /^(true|false|null)\b/.exec(code.slice(index));
      if (match) {
        tokens.push({
          kind: 'literal',
          value: match[0],
        });
        lastWas = 'value';
        index += match[0].length;
        continue;
      }
    }

    tokens.push({
      kind: 'plain',
      value: character,
    });
    index++;
  }

  return mergePlainTokens(tokens);
}
