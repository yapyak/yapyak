import { describe, expect, it } from 'vitest';

import { richText } from './rich-text';

describe('richText', () => {
  it('transforms a single tag with the handler output', () => {
    const result = richText('Click <link>here</link>.', {
      link: (children) => `<a href="/x">${children}</a>`,
    } as Record<string, (children: string) => string>);
    expect(result).toBe('Click <a href="/x">here</a>.');
  });

  it('preserves text without any tags', () => {
    const result = richText('Hello world.', {} as Record<string, never>);
    expect(result).toBe('Hello world.');
  });

  it('transforms multiple distinct tags in one source', () => {
    const result = richText(
      'Read the <link>docs</link> for <bold>everything</bold>.',
      {
        bold: (children) => `*${children}*`,
        link: (children) => `[${children}]`,
      } as Record<string, (children: string) => string>,
    );
    expect(result).toBe('Read the [docs] for *everything*.');
  });

  it('transforms the same tag used multiple times', () => {
    const result = richText(
      '<em>One</em> and <em>two</em> and <em>three</em>.',
      {
        em: (children) => `_${children}_`,
      } as Record<string, (children: string) => string>,
    );
    expect(result).toBe('_One_ and _two_ and _three_.');
  });

  it('transforms nested tags recursively', () => {
    const result = richText(
      'A <outer>nested <inner>tag</inner> inside</outer>.',
      {
        inner: (children) => `(${children})`,
        outer: (children) => `[${children}]`,
      } as Record<string, (children: string) => string>,
    );
    expect(result).toBe('A [nested (tag) inside].');
  });

  it('preserves unknown tags as literal text', () => {
    const result = richText(
      '<unknown>kept</unknown> and <link>replaced</link>.',
      {
        link: (children) => `[${children}]`,
      } as Record<string, (children: string) => string>,
    );
    expect(result).toBe('<unknown>kept</unknown> and [replaced].');
  });

  it('preserves unclosed tags as literal text', () => {
    const result = richText('A <link>unclosed string', {
      link: (children) => `[${children}]`,
    } as Record<string, (children: string) => string>);
    expect(result).toBe('A <link>unclosed string');
  });

  it('preserves children unchanged when handlers return them as-is', () => {
    const result = richText('Click <link>here</link> and <bold>here</bold>.', {
      bold: (children) => children,
      link: (children) => children,
    } as Record<string, (children: string) => string>);
    expect(result).toBe('Click here and here.');
  });

  it('transforms empty tag contents', () => {
    const result = richText('Before<break></break>after.', {
      break: () => '<br>',
    } as Record<string, (children: string) => string>);
    expect(result).toBe('Before<br>after.');
  });
});
