import type { ReactNode } from 'react';

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RichText } from './rich-text';

describe('RichText', () => {
  it('returns the source string when it holds no tags', () => {
    const { container } = render(<RichText value="Hello" />);
    expect(container.textContent).toBe('Hello');
  });

  it('binds every named tag to the matching handler', () => {
    const props = {
      link: (children: ReactNode) => <a href="/x">{children}</a>,
      value: 'Click <link>here</link>.',
    } as unknown as Parameters<typeof RichText>[0];
    const { container } = render(<RichText {...props} />);
    const link = container.querySelector('a');
    expect(link?.textContent).toBe('here');
    expect(link?.getAttribute('href')).toBe('/x');
  });

  it('emits every tag when multiple are present', () => {
    const { container } = render(<RichText value="<a>one</a> <b>two</b>" />);
    expect(container.textContent).toContain('<a>');
    expect(container.textContent).toContain('one');
    expect(container.textContent).toContain('</a>');
    expect(container.textContent).toContain('<b>');
    expect(container.textContent).toContain('two');
    expect(container.textContent).toContain('</b>');
  });

  it('emits the unmatched tag as literal text', () => {
    const { container } = render(<RichText value="<unknown>Hi</unknown>" />);
    expect(container.textContent).toContain('<unknown>');
    expect(container.textContent).toContain('Hi');
    expect(container.textContent).toContain('</unknown>');
  });

  it('preserves text between tags', () => {
    const { container } = render(
      <RichText value="before <tag>middle</tag> after" />,
    );
    expect(container.textContent).toContain('before');
    expect(container.textContent).toContain('middle');
    expect(container.textContent).toContain('after');
  });

  it('walks nested tags recursively', () => {
    const { container } = render(
      <RichText value="<outer>before <inner>nested</inner> after</outer>" />,
    );
    expect(container.textContent).toContain('<outer>');
    expect(container.textContent).toContain('<inner>');
    expect(container.textContent).toContain('nested');
    expect(container.textContent).toContain('</inner>');
    expect(container.textContent).toContain('</outer>');
  });
});
