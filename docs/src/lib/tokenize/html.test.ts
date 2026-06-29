import type { TokenKind } from './type';

import { describe, expect, it } from 'vitest';

import { tokenizeHtml } from './html';

function types(code: string): TokenKind[] {
  return tokenizeHtml(code)
    .filter((token) => token.kind !== 'plain')
    .map((token) => token.kind);
}

describe('tokenizeHtml', () => {
  it('returns a `jsx-tag` token for an opening tag', () => {
    expect(types('<div>')).toContain('jsx-tag');
  });

  it('returns a `jsx-tag` token for a closing tag', () => {
    expect(types('</div>')).toContain('jsx-tag');
  });

  it('returns a `jsx-tag` token for a self-closing `/>`', () => {
    expect(types('<br />').filter((type) => type === 'jsx-tag')).toEqual([
      'jsx-tag',
      'jsx-tag',
    ]);
  });

  it('returns a `comment` token for an HTML comment', () => {
    expect(types('<!-- Hello -->')).toContain('comment');
  });

  it('returns a `string` token for a double-quoted attribute value', () => {
    expect(types('<a href="Hello">')).toContain('string');
  });

  it('returns a `fn-call` token for an attribute name', () => {
    expect(types('<a href="World">')).toContain('fn-call');
  });

  it('returns a `punct` token for an attribute `=`', () => {
    expect(types('<a href="World">')).toContain('punct');
  });
});
