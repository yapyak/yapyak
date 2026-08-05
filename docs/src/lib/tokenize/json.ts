import type { Token } from './type';

import { mergePlainTokens } from './plain-token';

export function tokenizeJson(code: string) {
  const tokens: Token[] = [];
  let index = 0;
  let previousRole: 'open' | 'colon' | 'comma' | 'value' | undefined;

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
      previousRole = 'open';
      index++;
      continue;
    }

    if (character === '}' || character === ']') {
      tokens.push({
        kind: 'punct',
        value: character,
      });
      previousRole = 'value';
      index++;
      continue;
    }

    if (character === ':') {
      tokens.push({
        kind: 'punct',
        value: character,
      });
      previousRole = 'colon';
      index++;
      continue;
    }

    if (character === ',') {
      tokens.push({
        kind: 'punct',
        value: character,
      });
      previousRole = 'comma';
      index++;
      continue;
    }

    if (character === '"') {
      const match = /^"(?:\\.|[^"\\])*"/.exec(code.slice(index));
      if (match) {
        const isValue = previousRole === 'colon';
        tokens.push({
          kind: isValue ? 't-source' : 'string',
          value: match[0],
        });
        previousRole = 'value';
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
        previousRole = 'value';
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
        previousRole = 'value';
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
