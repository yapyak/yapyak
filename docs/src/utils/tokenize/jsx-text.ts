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
  let inText = false;
  let exprDepth = 0;
  let rawTextDepth = 0;

  for (const token of tokens) {
    if (token.type === 'jsx-tag') {
      inText = false;
      if (token.value === '/>') {
        depth = Math.max(0, depth - 1);
        if (depth > 0 && exprDepth === 0 && rawTextDepth === 0) {
          inText = true;
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
          inText = true;
        }
        continue;
      }
      if (value === '<') {
        inText = false;
        continue;
      }
      if (value === '{' && inText) {
        exprDepth++;
        inText = false;
        token.type = 'jsx-brace';
        continue;
      }
      if (value === '}' && exprDepth > 0) {
        const wasOutermost = exprDepth === 1;
        exprDepth--;
        if (exprDepth === 0 && depth > 0 && rawTextDepth === 0) {
          inText = true;
        }
        if (wasOutermost && depth > 0) {
          token.type = 'jsx-brace';
        }
        continue;
      }
    }

    if (inText) {
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
