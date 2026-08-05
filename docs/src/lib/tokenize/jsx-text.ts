import type { Token } from './type';

const RAW_TEXT_TAGS = new Set([
  '<script',
  '<style',
]);
const RAW_TEXT_CLOSE_TAGS = new Set([
  '</script',
  '</style',
]);

export function reclassifyJsxText(tokens: Token[]): void {
  let depth = 0;
  let isInText = false;
  let expressionDepth = 0;
  let rawTextDepth = 0;

  for (const token of tokens) {
    if (token.kind === 'jsx-tag') {
      isInText = false;
      if (token.value === '/>') {
        depth = Math.max(0, depth - 1);
        if (depth > 0 && expressionDepth === 0 && rawTextDepth === 0) {
          isInText = true;
        }
      } else if (token.value.startsWith('</')) {
        depth = Math.max(0, depth - 1);
        if (RAW_TEXT_CLOSE_TAGS.has(token.value)) {
          rawTextDepth = Math.max(0, rawTextDepth - 1);
        }
      } else {
        depth++;
        if (RAW_TEXT_TAGS.has(token.value)) {
          rawTextDepth++;
        }
      }
      continue;
    }

    if (token.kind === 'punct') {
      const value = token.value;
      if (value === '>') {
        if (depth > 0 && expressionDepth === 0 && rawTextDepth === 0) {
          isInText = true;
        }
        continue;
      }
      if (value === '<') {
        isInText = false;
        continue;
      }
      if (value === '{' && isInText) {
        expressionDepth++;
        isInText = false;
        token.kind = 'jsx-brace';
        continue;
      }
      if (value === '}' && expressionDepth > 0) {
        const wasOutermost = expressionDepth === 1;
        expressionDepth--;
        if (expressionDepth === 0 && depth > 0 && rawTextDepth === 0) {
          isInText = true;
        }
        if (wasOutermost && depth > 0) {
          token.kind = 'jsx-brace';
        }
        continue;
      }
    }

    if (isInText) {
      if (
        token.kind === 'keyword' ||
        token.kind === 'literal' ||
        token.kind === 'type' ||
        token.kind === 'fn-call'
      ) {
        token.kind = 'plain';
      }
    }
  }
}
