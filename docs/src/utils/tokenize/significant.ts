import type { Token } from './type';

export function findNextSignificant(
  tokens: Token[],
  from: number,
): number | undefined {
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
  return undefined;
}
