import type { SlotAccessor } from './rich-text';

import { describe, expect, it } from 'vitest';
import { parseRichText } from 'yapyak';

import { CHILDREN_TOKEN } from './children-token';
import { renderRichText } from './rich-text';

function buildSlots(templates: Record<string, string>): SlotAccessor {
  return {
    has: (name) => name in templates,
    render: async (name) => templates[name] ?? '',
  };
}

describe('renderRichText', () => {
  it('transforms a tag into its slot template with children inlined', async () => {
    const parts = parseRichText('Click <link>here</link>.');
    const slots = buildSlots({
      link: `<a href="/docs">${CHILDREN_TOKEN}</a>`,
    });
    const result = await renderRichText(parts, slots);
    expect(result).toBe('Click <a href="/docs">here</a>.');
  });

  it('preserves text without any tags after escape', async () => {
    const parts = parseRichText('Hello world.');
    const result = await renderRichText(parts, buildSlots({}));
    expect(result).toBe('Hello world.');
  });

  it('transforms `<` and `>` in leaf text to entities', async () => {
    const parts = parseRichText('safe <em>not a tag');
    const result = await renderRichText(parts, buildSlots({}));
    expect(result).toBe('safe &lt;em&gt;not a tag');
  });

  it('transforms `&` to `&amp;` in leaf text', async () => {
    const parts = parseRichText('Tom & Jerry');
    const result = await renderRichText(parts, buildSlots({}));
    expect(result).toBe('Tom &amp; Jerry');
  });

  it('transforms `"` to `&quot;` in leaf text', async () => {
    const parts = parseRichText('He said "hi".');
    const result = await renderRichText(parts, buildSlots({}));
    expect(result).toBe('He said &quot;hi&quot;.');
  });

  it("transforms `'` to `&#39;` in leaf text", async () => {
    const parts = parseRichText("It's");
    const result = await renderRichText(parts, buildSlots({}));
    expect(result).toBe('It&#39;s');
  });

  it('transforms `<script>` in a translator string to escaped entities', async () => {
    const parts = parseRichText('<script>alert(1)</script>');
    const result = await renderRichText(parts, buildSlots({}));
    expect(result).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('transforms an unmatched tag to escaped literal text', async () => {
    const parts = parseRichText('<unknown>kept</unknown>');
    const result = await renderRichText(parts, buildSlots({}));
    expect(result).toBe('&lt;unknown&gt;kept&lt;/unknown&gt;');
  });

  it('transforms children inside a matched slot through the leaf escape', async () => {
    const parts = parseRichText('Click <link>1 < 2 & 3</link>.');
    const slots = buildSlots({
      link: `<a>${CHILDREN_TOKEN}</a>`,
    });
    const result = await renderRichText(parts, slots);
    expect(result).toBe('Click <a>1 &lt; 2 &amp; 3</a>.');
  });

  it('transforms multiple occurrences of the same tag using one slot template', async () => {
    const parts = parseRichText('<b>one</b>, <b>two</b>, <b>three</b>');
    const slots = buildSlots({
      b: `<strong>${CHILDREN_TOKEN}</strong>`,
    });
    const result = await renderRichText(parts, slots);
    expect(result).toBe(
      '<strong>one</strong>, <strong>two</strong>, <strong>three</strong>',
    );
  });

  it('transforms nested tags recursively', async () => {
    const parts = parseRichText(
      'A <outer>nested <inner>tag</inner> inside</outer>.',
    );
    const slots = buildSlots({
      inner: `(${CHILDREN_TOKEN})`,
      outer: `[${CHILDREN_TOKEN}]`,
    });
    const result = await renderRichText(parts, slots);
    expect(result).toBe('A [nested (tag) inside].');
  });

  it('preserves the slot template verbatim when it carries no children token', async () => {
    const parts = parseRichText('Before <break></break> after');
    const slots = buildSlots({
      break: '<br>',
    });
    const result = await renderRichText(parts, slots);
    expect(result).toBe('Before <br> after');
  });

  it('preserves the slot template when the token appears multiple times', async () => {
    const parts = parseRichText('<wrap>X</wrap>');
    const slots = buildSlots({
      wrap: `<a>${CHILDREN_TOKEN}</a><b>${CHILDREN_TOKEN}</b>`,
    });
    const result = await renderRichText(parts, slots);
    expect(result).toBe('<a>X</a><b>X</b>');
  });

  it('builds a single slot-render call per unique tag name', async () => {
    const parts = parseRichText('<b>1</b><b>2</b><b>3</b>');
    const calls: string[] = [];
    const slots: SlotAccessor = {
      has: () => true,
      render: async (name) => {
        calls.push(name);
        return `<strong>${CHILDREN_TOKEN}</strong>`;
      },
    };
    await renderRichText(parts, slots);
    expect(calls).toEqual([
      'b',
    ]);
  });

  it('returns an empty string for an empty source', async () => {
    const parts = parseRichText('');
    const result = await renderRichText(parts, buildSlots({}));
    expect(result).toBe('');
  });
});
