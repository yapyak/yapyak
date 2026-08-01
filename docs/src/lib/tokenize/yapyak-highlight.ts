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

    if (token.kind === 'string' && YAPYAK_STRING_RX.test(token.value)) {
      token.kind = 'tx-yapyak';
      continue;
    }

    if (
      (token.kind === 'fn-call' || token.kind === 'plain') &&
      token.value === 't'
    ) {
      const next = findNextSignificant(tokens, index + 1);
      if (next === undefined) {
        continue;
      }

      if (tokens[next]?.kind === 'punct' && tokens[next]?.value === '(') {
        const argumentIndex = findNextSignificant(tokens, next + 1);
        if (argumentIndex !== undefined) {
          const argumentToken = tokens[argumentIndex];
          if (
            argumentToken !== undefined &&
            (argumentToken.kind === 'string' ||
              argumentToken.kind === 'template') &&
            !isDottedKey(argumentToken.value)
          ) {
            token.kind = 'tx-call';
            argumentToken.kind = 'tx-source';
          }
        }
        continue;
      }

      if (tokens[next]?.kind === 'punct' && tokens[next]?.value === '.') {
        let dot = next;
        for (;;) {
          const method = findNextSignificant(tokens, dot + 1);
          if (method === undefined) {
            break;
          }
          const methodValue = tokens[method]?.value;
          if (methodValue !== 'as' && methodValue !== 'in') {
            break;
          }
          const paren = findNextSignificant(tokens, method + 1);
          if (
            paren === undefined ||
            tokens[paren]?.kind !== 'punct' ||
            tokens[paren]?.value !== '('
          ) {
            break;
          }
          const firstArgument = findNextSignificant(tokens, paren + 1);
          if (firstArgument === undefined) {
            break;
          }
          const comma = findTopLevelComma(tokens, firstArgument + 1);
          if (comma !== undefined) {
            const secondArgument = findNextSignificant(tokens, comma + 1);
            if (secondArgument === undefined) {
              break;
            }
            const secondToken = tokens[secondArgument];
            if (
              secondToken !== undefined &&
              (secondToken.kind === 'string' ||
                secondToken.kind === 'template') &&
              !isDottedKey(secondToken.value)
            ) {
              secondToken.kind = 'tx-source';
            }
            break;
          }
          const callEnd = findCallEnd(tokens, paren);
          if (callEnd === undefined) {
            break;
          }
          const afterCall = findNextSignificant(tokens, callEnd + 1);
          if (
            afterCall === undefined ||
            tokens[afterCall]?.kind !== 'punct' ||
            tokens[afterCall]?.value !== '.'
          ) {
            break;
          }
          dot = afterCall;
        }
      }
    }

    if (token.kind === 'fn-call' && token.value === '_$pick') {
      const openParen = findNextSignificant(tokens, index + 1);
      if (
        openParen !== undefined &&
        tokens[openParen]?.kind === 'punct' &&
        tokens[openParen]?.value === '('
      ) {
        let depth = 1;
        let cursor = openParen + 1;
        while (cursor < tokens.length && depth > 0) {
          const inner = tokens[cursor];
          if (inner === undefined) {
            break;
          }
          if (inner.kind === 'punct') {
            if (inner.value === '(') {
              depth++;
            } else if (inner.value === ')') {
              depth--;
            }
          }
          if (inner.kind === 'string' || inner.kind === 'template') {
            inner.kind = 'tx-source';
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

function findCallEnd(tokens: Token[], openParen: number): number | undefined {
  let depth = 0;
  for (let index = openParen; index < tokens.length; index++) {
    const token = tokens[index];
    if (token === undefined) {
      continue;
    }
    if (token.kind === 'punct') {
      if (token.value === '(') {
        depth++;
        continue;
      }
      if (token.value === ')') {
        depth--;
        if (depth === 0) {
          return index;
        }
      }
    }
  }
  return undefined;
}

function findTopLevelComma(tokens: Token[], from: number): number | undefined {
  let depth = 0;
  for (let index = from; index < tokens.length; index++) {
    const token = tokens[index];
    if (token === undefined) {
      continue;
    }
    if (token.kind === 'punct') {
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
