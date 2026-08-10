import type { Token } from './type';

const TAG_RX = /^(<\/?)([A-Za-z][\w.-]*)$/;

const BRACKET_VALUES = new Set([
  '>',
  '/>',
]);

export function splitJsxBrackets(tokens: Token[]): Token[] {
  const result: Token[] = [];

  for (const token of tokens) {
    if (token.kind !== 'jsx-tag') {
      result.push(token);
      continue;
    }

    if (BRACKET_VALUES.has(token.value)) {
      result.push({
        kind: 'punct',
        value: token.value,
      });
      continue;
    }

    const match = TAG_RX.exec(token.value);
    if (match === null) {
      result.push(token);
      continue;
    }

    result.push({
      kind: 'punct',
      value: match[1] ?? '',
    });
    result.push({
      kind: 'jsx-tag',
      value: match[2] ?? '',
    });
  }

  return result;
}
