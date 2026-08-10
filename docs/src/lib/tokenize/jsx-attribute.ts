import type { Token, TokenKind } from './type';

const ATTRIBUTE_NAME_RX = /^[A-Za-z_:@][\w:.-]*$/;

const ATTRIBUTE_NAME_KINDS = new Set<TokenKind>([
  'plain',
  'keyword',
  'type',
  'literal',
  'fn-call',
]);

const OPENING_BRACKETS = new Set([
  '{',
  '(',
  '[',
]);

const CLOSING_BRACKETS = new Set([
  '}',
  ')',
  ']',
]);

export function markJsxAttributes(tokens: Token[]): void {
  let isInsideTag = false;
  let expectsName = false;
  let depth = 0;

  for (const token of tokens) {
    if (token.kind === 'jsx-tag') {
      isInsideTag =
        token.value.startsWith('<') && !token.value.startsWith('</');
      expectsName = isInsideTag;
      depth = 0;
      continue;
    }

    if (!isInsideTag) {
      continue;
    }

    if (token.kind === 'punct') {
      if (token.value === '>') {
        isInsideTag = false;
        expectsName = false;
        continue;
      }
      if (token.value === '=' && depth === 0) {
        expectsName = false;
        continue;
      }
      if (OPENING_BRACKETS.has(token.value)) {
        depth++;
        continue;
      }
      if (CLOSING_BRACKETS.has(token.value)) {
        depth = Math.max(0, depth - 1);
        if (depth === 0) {
          expectsName = true;
        }
      }
      continue;
    }

    if (token.kind === 'string') {
      if (depth === 0) {
        expectsName = true;
      }
      continue;
    }

    if (
      depth === 0 &&
      expectsName &&
      ATTRIBUTE_NAME_KINDS.has(token.kind) &&
      ATTRIBUTE_NAME_RX.test(token.value)
    ) {
      token.kind = 'jsx-attribute';
    }
  }
}
