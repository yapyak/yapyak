import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';

import RichText from './rich-text.svelte';

describe('RichText', () => {
  it('returns the source string when it holds no tags', () => {
    const { body } = render(RichText, { props: { value: 'Hello' } });
    expect(body).toContain('Hello');
  });

  it('emits the unmatched tag as literal angle-bracket text', () => {
    const { body } = render(RichText, {
      props: { value: '<unknown>Hi</unknown>' },
    });
    expect(body).toContain('&lt;unknown');
    expect(body).toContain('Hi');
    expect(body).toContain('&lt;/unknown');
  });
});
