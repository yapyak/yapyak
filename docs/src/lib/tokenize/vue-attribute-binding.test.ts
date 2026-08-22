import type { Token } from './type';

import { describe, expect, it } from 'vitest';

import { tokenize } from './tokenize';

function marks(code: string) {
  return tokenize(code, 'vue')
    .filter((token: Token) => token.kind === 'jsx-attribute')
    .map((token) => token.value);
}

function inner(code: string) {
  return tokenize(code, 'vue')
    .map((token) => `${token.value}:${token.kind}`)
    .join(' ');
}

describe('expandVueAttributeBindings', () => {
  it('marks a slot shorthand with its name', () => {
    expect(marks('<template #link="{ children }">')).toEqual([
      '#',
      'link',
    ]);
  });

  it('marks a bind shorthand with its name', () => {
    expect(marks('<component :is="children" />')).toEqual([
      ':',
      'is',
    ]);
  });

  it('marks an event shorthand with its name', () => {
    expect(marks('<button @click="go" />')).toEqual([
      '@',
      'click',
    ]);
  });

  it('parses a slot value as an expression', () => {
    expect(inner('<template #link="{ children }">')).toContain('{:punct');
  });

  it('parses a bind value as an expression', () => {
    expect(inner(`<RichText :value="t('Hi')">`)).toContain("'Hi':t-source");
  });

  it('preserves a plain attribute', () => {
    expect(marks('<a href="/x" />')).toEqual([
      'href',
    ]);
  });
});
