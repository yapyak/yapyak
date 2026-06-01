import { describe, expect, it } from 'vitest';

import { richText } from './rich-text';

describe('richText', () => {
  it('replaces a single tag with the handler output', () => {
    const result = richText('Click <link>here</link>.', {
      link: (children) => `<a href="/x">${children}</a>`,
    } as Record<string, (c: string) => string>);
    expect(result).toBe('Click <a href="/x">here</a>.');
  });

  it('preserves text without any tags', () => {
    const result = richText('Hello world.', {} as Record<string, never>);
    expect(result).toBe('Hello world.');
  });

  it('replaces multiple distinct tags in one source', () => {
    const result = richText(
      'Read the <link>docs</link> for <bold>everything</bold>.',
      {
        link: (c) => `[${c}]`,
        bold: (c) => `*${c}*`,
      } as Record<string, (c: string) => string>,
    );
    expect(result).toBe('Read the [docs] for *everything*.');
  });

  it('replaces the same tag used multiple times', () => {
    const result = richText(
      '<em>One</em> and <em>two</em> and <em>three</em>.',
      { em: (c) => `_${c}_` } as Record<string, (c: string) => string>,
    );
    expect(result).toBe('_One_ and _two_ and _three_.');
  });

  it('handles nested tags recursively', () => {
    const result = richText(
      'A <outer>nested <inner>tag</inner> inside</outer>.',
      {
        outer: (c) => `[${c}]`,
        inner: (c) => `(${c})`,
      } as Record<string, (c: string) => string>,
    );
    expect(result).toBe('A [nested (tag) inside].');
  });

  it('leaves unknown tags as literal text', () => {
    const result = richText('<unknown>kept</unknown> and <link>replaced</link>.', {
      link: (c) => `[${c}]`,
    } as Record<string, (c: string) => string>);
    expect(result).toBe('<unknown>kept</unknown> and [replaced].');
  });

  it('leaves unclosed tags as literal text', () => {
    const result = richText('A <link>unclosed string', {
      link: (c) => `[${c}]`,
    } as Record<string, (c: string) => string>);
    expect(result).toBe('A <link>unclosed string');
  });

  it('supports plain-text rendering by returning the children unchanged', () => {
    const result = richText(
      'Click <link>here</link> and <bold>here</bold>.',
      {
        link: (c) => c,
        bold: (c) => c,
      } as Record<string, (c: string) => string>,
    );
    expect(result).toBe('Click here and here.');
  });

  it('handles empty tag contents', () => {
    const result = richText('Before<break></break>after.', {
      break: () => '<br>',
    } as Record<string, (c: string) => string>);
    expect(result).toBe('Before<br>after.');
  });
});
