import type { Token } from './type';

import { findNextSignificant } from './significant';

const YAPYAK_STRING_RX = /^(["'`])yapyak(?:\/[\w-]+)*\1$/;

const DOTTED_KEY_RX = /^[a-zA-Z_][\w]*(?:\.[a-zA-Z_][\w]*)+$/;

export function applyYapyakHighlight(tokens: Token[]): void {
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token === undefined) {
      continue;
    }

    if (token.type === 'string' && YAPYAK_STRING_RX.test(token.value)) {
      token.type = 'tx-yapyak';
      continue;
    }

    if (
      (token.type === 'fn-call' || token.type === 'plain') &&
      token.value === 't'
    ) {
      const next = findNextSignificant(tokens, index + 1);
      if (next === undefined) {
        continue;
      }

      if (tokens[next]?.type === 'punct' && tokens[next]?.value === '(') {
        const argumentIndex = findNextSignificant(tokens, next + 1);
        if (argumentIndex !== undefined) {
          const argumentToken = tokens[argumentIndex];
          if (
            argumentToken !== undefined &&
            (argumentToken.type === 'string' ||
              argumentToken.type === 'template') &&
            !isDottedKey(argumentToken.value)
          ) {
            token.type = 'tx-call';
            argumentToken.type = 'tx-source';
          }
        }
        continue;
      }

      if (tokens[next]?.type === 'punct' && tokens[next]?.value === '.') {
        const method = findNextSignificant(tokens, next + 1);
        if (method === undefined) {
          continue;
        }
        const methodValue = tokens[method]?.value;
        if (methodValue !== 'as' && methodValue !== 'in') {
          continue;
        }
        const paren = findNextSignificant(tokens, method + 1);
        if (
          paren === undefined ||
          tokens[paren]?.type !== 'punct' ||
          tokens[paren]?.value !== '('
        ) {
          continue;
        }
        const firstArg = findNextSignificant(tokens, paren + 1);
        if (firstArg === undefined) {
          continue;
        }
        const comma = findTopLevelComma(tokens, firstArg + 1);
        if (comma === undefined) {
          continue;
        }
        const secondArg = findNextSignificant(tokens, comma + 1);
        if (secondArg === undefined) {
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
        openParen !== undefined &&
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

function isDottedKey(value: string): boolean {
  const inner = value.slice(1, -1);
  return DOTTED_KEY_RX.test(inner);
}

function findTopLevelComma(tokens: Token[], from: number): number | undefined {
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
          return undefined;
        }
        depth--;
        continue;
      }
      if (token.value === ',' && depth === 0) {
        return index;
      }
    }
  }
  return undefined;
}
