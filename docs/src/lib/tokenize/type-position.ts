import type { Token } from './type';

import { findNextSignificant } from './significant';

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

export function applyTypePositions(tokens: Token[]): void {
  let genericDepth = 0;

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token === undefined) {
      continue;
    }

    if (token.kind === 'punct' && token.value === '<') {
      const previousIndex = findPreviousSignificant(tokens, index - 1);
      const previous =
        previousIndex === undefined ? undefined : tokens[previousIndex];
      const isGenericOpen =
        previous !== undefined &&
        (previous.kind === 'type' ||
          previous.kind === 'fn-call' ||
          (previous.kind === 'plain' && /^[A-Z][\w$]*$/.test(previous.value)));
      if (isGenericOpen) {
        genericDepth++;
      }
    } else if (
      token.kind === 'punct' &&
      token.value === '>' &&
      genericDepth > 0
    ) {
      genericDepth--;
    }

    if (token.kind !== 'plain' && token.kind !== 'fn-call') {
      continue;
    }
    if (!/^[A-Z][\w$]*$/.test(token.value)) {
      continue;
    }

    if (genericDepth > 0) {
      token.kind = 'type';
      continue;
    }

    const previousIndex = findPreviousSignificant(tokens, index - 1);
    if (previousIndex === undefined) {
      continue;
    }
    const previous = tokens[previousIndex];
    if (previous === undefined) {
      continue;
    }

    const isTriggered =
      (previous.kind === 'punct' && /^[:<|&?]$/.test(previous.value)) ||
      (previous.kind === 'keyword' && TYPE_KEYWORDS.has(previous.value));

    if (isTriggered) {
      token.kind = 'type';
      continue;
    }

    const nextIndex = findNextSignificant(tokens, index + 1);
    if (nextIndex !== undefined) {
      const next = tokens[nextIndex];
      if (next?.kind === 'keyword' && next.value === 'in') {
        token.kind = 'type';
      }
    }
  }
}

function findPreviousSignificant(
  tokens: Token[],
  from: number,
): number | undefined {
  for (let index = from; index >= 0; index--) {
    const token = tokens[index];
    if (token === undefined) {
      continue;
    }
    if (token.kind === 'plain' && /^\s*$/.test(token.value)) {
      continue;
    }
    if (token.kind === 'comment') {
      continue;
    }
    return index;
  }
  return undefined;
}
