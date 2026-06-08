import type { VNodeArrayChildren, VNodeChild } from 'vue';

import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { renderToString } from 'vue/server-renderer';

import { RichText } from './rich-text';

describe('RichText', () => {
  it('returns the source string when it holds no tags', async () => {
    const html = await renderToString(h(RichText, { value: 'Hello' }));
    expect(html).toContain('Hello');
  });

  it('binds every named tag to the matching slot', async () => {
    const html = await renderToString(
      h(
        RichText,
        { value: 'Click <link>here</link>.' },
        {
          link: ({ children }: { children: () => VNodeChild[] }) =>
            h('a', { href: '/x' }, children() as VNodeArrayChildren),
        },
      ),
    );
    expect(html).toContain('<a href="/x">here</a>');
  });

  it('emits the unmatched tag as literal angle-bracket text', async () => {
    const html = await renderToString(
      h(RichText, { value: '<unknown>Hi</unknown>' }),
    );
    expect(html).toContain('&lt;unknown&gt;');
    expect(html).toContain('&lt;/unknown&gt;');
  });
});
