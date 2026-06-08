import type { ReactNode } from 'react';

import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { RichText } from './rich-text';

describe('RichText', () => {
  it('returns the source string when it holds no tags', () => {
    const html = renderToString(<RichText value="Hello" />);
    expect(html).toBe('Hello');
  });

  it('binds every named tag to the handler passed as a prop', () => {
    const props = {
      link: (children: ReactNode) => <a href="/x">{children}</a>,
      value: 'Click <link>here</link>.',
    } as unknown as Parameters<typeof RichText>[0];
    const html = renderToString(<RichText {...props} />);
    expect(html).toContain('<a href="/x">here</a>');
  });
});
