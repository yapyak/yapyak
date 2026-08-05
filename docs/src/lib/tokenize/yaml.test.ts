import { describe, expect, it } from 'vitest';

import { tokenizeYaml } from './yaml';

function types(code: string) {
  return tokenizeYaml(code)
    .filter((token) => token.kind !== 'plain')
    .map((token) => token.kind);
}

describe('tokenizeYaml', () => {
  it('returns a `keyword` token for a key', () => {
    expect(types('title: Hello')).toContain('keyword');
  });

  it('returns a `comment` token for a `#` line', () => {
    expect(types('# Hello')).toContain('comment');
  });

  it('returns a `string` token for a double-quoted value', () => {
    expect(types('title: "Hello"')).toContain('string');
  });

  it('returns a `number` token for a numeric value', () => {
    expect(types('count: 42')).toContain('number');
  });

  it('returns a `literal` token for `true`', () => {
    expect(types('open: true')).toContain('literal');
  });

  it('returns a `punct` token for a list `-` marker', () => {
    expect(types('- Hello')).toContain('punct');
  });
});
