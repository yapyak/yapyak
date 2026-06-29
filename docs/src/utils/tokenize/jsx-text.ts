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
  let exprDepth = 0;
  let rawTextDepth = 0;

  for (const token of tokens) {
    if (token.type === 'jsx-tag') {
      isInText = false;
      if (token.value === '/>') {
        depth = Math.max(0, depth - 1);
        if (depth > 0 && exprDepth === 0 && rawTextDepth === 0) {
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

    if (token.type === 'punct') {
      const value = token.value;
      if (value === '>') {
        if (depth > 0 && exprDepth === 0 && rawTextDepth === 0) {
          isInText = true;
        }
        continue;
      }
      if (value === '<') {
        isInText = false;
        continue;
      }
      if (value === '{' && isInText) {
        exprDepth++;
        isInText = false;
        token.type = 'jsx-brace';
        continue;
      }
      if (value === '}' && exprDepth > 0) {
        const wasOutermost = exprDepth === 1;
        exprDepth--;
        if (exprDepth === 0 && depth > 0 && rawTextDepth === 0) {
          isInText = true;
        }
        if (wasOutermost && depth > 0) {
          token.type = 'jsx-brace';
        }
        continue;
      }
    }

    if (isInText) {
      if (
        token.type === 'keyword' ||
        token.type === 'literal' ||
        token.type === 'type' ||
        token.type === 'fn-call'
      ) {
        token.type = 'plain';
      }
    }
  }
}
