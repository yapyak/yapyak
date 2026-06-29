import type { Token } from './type';

export function mergePlainTokens(tokens: Token[]): Token[] {
  const result: Token[] = [];
  for (const token of tokens) {
    const previous = result[result.length - 1];
    if (
      previous !== undefined &&
      previous.kind === 'plain' &&
      token.kind === 'plain'
    ) {
      previous.value += token.value;
    } else {
      result.push({
        ...token,
      });
    }
  }
  return result;
}
