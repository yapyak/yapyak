import type { TagHandler } from './rich-text';

import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';

import RichText from './rich-text.svelte';

describe('RichText', () => {
  it('returns the source string when it holds no tags', () => {
    const { container } = render(RichText, {
      props: {
        value: 'Hello',
      },
    });
    expect(container.textContent).toBe('Hello');
  });

  it('binds every named tag to the matching handler', () => {
    const link = createRawSnippet(() => ({
      render: () => '<a href="/x">LINK</a>',
    })) as unknown as TagHandler;
    const props = {
      link,
      value: 'Click <link>here</link>.',
    } as unknown as {
      value: string;
    };
    const { container } = render(RichText, {
      props,
    });
    const anchor = container.querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('/x');
  });

  it('emits every tag when multiple are present', () => {
    const { container } = render(RichText, {
      props: {
        value: '<a>one</a> <b>two</b>',
      },
    });
    expect(container.textContent).toContain('<a>');
    expect(container.textContent).toContain('one');
    expect(container.textContent).toContain('</a>');
    expect(container.textContent).toContain('<b>');
    expect(container.textContent).toContain('two');
    expect(container.textContent).toContain('</b>');
  });

  it('emits the unmatched tag as literal text', () => {
    const { container } = render(RichText, {
      props: {
        value: '<unknown>Hi</unknown>',
      },
    });
    expect(container.textContent).toContain('<unknown>');
    expect(container.textContent).toContain('Hi');
    expect(container.textContent).toContain('</unknown>');
  });

  it('preserves text between tags', () => {
    const { container } = render(RichText, {
      props: {
        value: 'before <tag>middle</tag> after',
      },
    });
    expect(container.textContent).toContain('before');
    expect(container.textContent).toContain('middle');
    expect(container.textContent).toContain('after');
  });

  it('walks nested tags recursively', () => {
    const { container } = render(RichText, {
      props: {
        value: '<outer>before <inner>nested</inner> after</outer>',
      },
    });
    expect(container.textContent).toContain('<outer>');
    expect(container.textContent).toContain('<inner>');
    expect(container.textContent).toContain('nested');
    expect(container.textContent).toContain('</inner>');
    expect(container.textContent).toContain('</outer>');
  });
});
