import type { Token } from './type';

const BRACE_VALUES = new Set([
  '{',
  '}',
]);

export function markJsxMustaches(tokens: Token[]): void {
  for (const [index, token] of tokens.entries()) {
    if (token.kind !== 'punct' || !BRACE_VALUES.has(token.value)) {
      continue;
    }

    const previous = tokens[index - 1];
    const next = tokens[index + 1];
    if (
      (previous?.kind === 'jsx-brace' && previous.value === token.value) ||
      (next?.kind === 'jsx-brace' && next.value === token.value)
    ) {
      token.kind = 'jsx-brace';
    }
  }
}
