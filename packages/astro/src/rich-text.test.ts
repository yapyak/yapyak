import type { SlotAccessor } from './rich-text';

import { describe, expect, it } from 'vitest';
import { parseRichText } from 'yapyak';

import { CHILDREN_TOKEN } from './children-token';
import { renderRichText } from './rich-text';

function buildSlotAccessor(templates: Record<string, string>): SlotAccessor {
  return {
    has: (name) => name in templates,
    render: async (name) => templates[name] ?? '',
  };
}

describe('renderRichText', () => {
  it('transforms a tag into its slot template with children inlined', async () => {
    const nodes = parseRichText('Click <link>here</link>.');
    const slotAccessor = buildSlotAccessor({
      link: `<a href="/docs">${CHILDREN_TOKEN}</a>`,
    });
    const result = await renderRichText(nodes, slotAccessor);
    expect(result).toBe('Click <a href="/docs">here</a>.');
  });

  it('preserves text without any tags after escape', async () => {
    const nodes = parseRichText('Hello world.');
    const result = await renderRichText(nodes, buildSlotAccessor({}));
    expect(result).toBe('Hello world.');
  });

  it('transforms `<` and `>` in leaf text to entities', async () => {
    const nodes = parseRichText('safe <em>not a tag');
    const result = await renderRichText(nodes, buildSlotAccessor({}));
    expect(result).toBe('safe &lt;em&gt;not a tag');
  });

  it('transforms `&` to `&amp;` in leaf text', async () => {
    const nodes = parseRichText('Tom & Jerry');
    const result = await renderRichText(nodes, buildSlotAccessor({}));
    expect(result).toBe('Tom &amp; Jerry');
  });

  it('transforms `"` to `&quot;` in leaf text', async () => {
    const nodes = parseRichText('He said "hi".');
    const result = await renderRichText(nodes, buildSlotAccessor({}));
    expect(result).toBe('He said &quot;hi&quot;.');
  });

  it("transforms `'` to `&#39;` in leaf text", async () => {
    const nodes = parseRichText("It's");
    const result = await renderRichText(nodes, buildSlotAccessor({}));
    expect(result).toBe('It&#39;s');
  });

  it('transforms `<script>` in a translator string to escaped entities', async () => {
    const nodes = parseRichText('<script>alert(1)</script>');
    const result = await renderRichText(nodes, buildSlotAccessor({}));
    expect(result).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('transforms an unmatched tag to escaped literal text', async () => {
    const nodes = parseRichText('<unknown>kept</unknown>');
    const result = await renderRichText(nodes, buildSlotAccessor({}));
    expect(result).toBe('&lt;unknown&gt;kept&lt;/unknown&gt;');
  });

  it('transforms children inside a matched slot through the leaf escape', async () => {
    const nodes = parseRichText('Click <link>1 < 2 & 3</link>.');
    const slotAccessor = buildSlotAccessor({
      link: `<a>${CHILDREN_TOKEN}</a>`,
    });
    const result = await renderRichText(nodes, slotAccessor);
    expect(result).toBe('Click <a>1 &lt; 2 &amp; 3</a>.');
  });

  it('transforms multiple occurrences of the same tag using one slot template', async () => {
    const nodes = parseRichText('<b>one</b>, <b>two</b>, <b>three</b>');
    const slotAccessor = buildSlotAccessor({
      b: `<strong>${CHILDREN_TOKEN}</strong>`,
    });
    const result = await renderRichText(nodes, slotAccessor);
    expect(result).toBe(
      '<strong>one</strong>, <strong>two</strong>, <strong>three</strong>',
    );
  });

  it('transforms nested tags recursively', async () => {
    const nodes = parseRichText(
      'A <outer>nested <inner>tag</inner> inside</outer>.',
    );
    const slotAccessor = buildSlotAccessor({
      inner: `(${CHILDREN_TOKEN})`,
      outer: `[${CHILDREN_TOKEN}]`,
    });
    const result = await renderRichText(nodes, slotAccessor);
    expect(result).toBe('A [nested (tag) inside].');
  });

  it('preserves the slot template verbatim when it carries no children token', async () => {
    const nodes = parseRichText('Before <break></break> after');
    const slotAccessor = buildSlotAccessor({
      break: '<br>',
    });
    const result = await renderRichText(nodes, slotAccessor);
    expect(result).toBe('Before <br> after');
  });

  it('preserves the slot template when the token appears multiple times', async () => {
    const nodes = parseRichText('<wrap>X</wrap>');
    const slotAccessor = buildSlotAccessor({
      wrap: `<a>${CHILDREN_TOKEN}</a><b>${CHILDREN_TOKEN}</b>`,
    });
    const result = await renderRichText(nodes, slotAccessor);
    expect(result).toBe('<a>X</a><b>X</b>');
  });

  it('builds a single slot-render call per unique tag name', async () => {
    const nodes = parseRichText('<b>1</b><b>2</b><b>3</b>');
    const calls: string[] = [];
    const slotAccessor: SlotAccessor = {
      has: () => true,
      render: async (name) => {
        calls.push(name);
        return `<strong>${CHILDREN_TOKEN}</strong>`;
      },
    };
    await renderRichText(nodes, slotAccessor);
    expect(calls).toEqual([
      'b',
    ]);
  });

  it('returns an empty string for an empty source', async () => {
    const nodes = parseRichText('');
    const result = await renderRichText(nodes, buildSlotAccessor({}));
    expect(result).toBe('');
  });
});
