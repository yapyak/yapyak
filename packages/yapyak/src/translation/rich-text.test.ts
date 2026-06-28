import type { RichTextNode } from './rich-text';

import { fc, it } from '@fast-check/vitest';
import { describe, expect } from 'vitest';

import { parseRichText, walkRichText } from './rich-text';

describe('parseRichText', () => {
  it('returns a single text node for a source without tags', () => {
    expect(parseRichText('Save changes')).toEqual([
      {
        type: 'text',
        value: 'Save changes',
      },
    ]);
  });

  it('returns an empty array for an empty source', () => {
    expect(parseRichText('')).toEqual([]);
  });

  it('parses a pair tag with text children', () => {
    expect(parseRichText('Click <link>here</link>.')).toEqual([
      {
        type: 'text',
        value: 'Click ',
      },
      {
        children: [
          {
            type: 'text',
            value: 'here',
          },
        ],
        name: 'link',
        type: 'pair',
      },
      {
        type: 'text',
        value: '.',
      },
    ]);
  });

  it('walks nested pair tags recursively', () => {
    expect(parseRichText('<a>x <b>y</b> z</a>')).toEqual([
      {
        children: [
          {
            type: 'text',
            value: 'x ',
          },
          {
            children: [
              {
                type: 'text',
                value: 'y',
              },
            ],
            name: 'b',
            type: 'pair',
          },
          {
            type: 'text',
            value: ' z',
          },
        ],
        name: 'a',
        type: 'pair',
      },
    ]);
  });

  it('parses a void tag as a void node with no children', () => {
    expect(parseRichText('First<br/>Second')).toEqual([
      {
        type: 'text',
        value: 'First',
      },
      {
        name: 'br',
        type: 'void',
      },
      {
        type: 'text',
        value: 'Second',
      },
    ]);
  });

  it('parses a void tag with a single space before the slash', () => {
    expect(parseRichText('First<br />Second')).toEqual([
      {
        type: 'text',
        value: 'First',
      },
      {
        name: 'br',
        type: 'void',
      },
      {
        type: 'text',
        value: 'Second',
      },
    ]);
  });

  it('parses a void tag with multiple spaces before the slash', () => {
    expect(parseRichText('First<br   />Second')).toEqual([
      {
        type: 'text',
        value: 'First',
      },
      {
        name: 'br',
        type: 'void',
      },
      {
        type: 'text',
        value: 'Second',
      },
    ]);
  });

  it('parses a void tag nested inside a pair tag', () => {
    expect(parseRichText('<link>click <icon/> here</link>')).toEqual([
      {
        children: [
          {
            type: 'text',
            value: 'click ',
          },
          {
            name: 'icon',
            type: 'void',
          },
          {
            type: 'text',
            value: ' here',
          },
        ],
        name: 'link',
        type: 'pair',
      },
    ]);
  });

  it('preserves a tag with attributes as literal text', () => {
    expect(parseRichText('<a href="x">click</a>')).toEqual([
      {
        type: 'text',
        value: '<a href="x">click</a>',
      },
    ]);
  });

  it('preserves an unclosed pair tag as literal text', () => {
    expect(parseRichText('A <link>unclosed string')).toEqual([
      {
        type: 'text',
        value: 'A <link>unclosed string',
      },
    ]);
  });

  it('refuses a tag name containing characters outside `[A-Za-z][A-Za-z0-9]*`', () => {
    expect(parseRichText('<my-link>x</my-link>')).toEqual([
      {
        type: 'text',
        value: '<my-link>x</my-link>',
      },
    ]);
  });
});

describe('walkRichText', () => {
  const stringRenderer = {
    concat: (parts: string[]): string => parts.join(''),
    leaf: (text: string): string => text,
  };

  it('transforms a pair tag through its handler', () => {
    const result = walkRichText<string>(
      'Click <link>here</link>.',
      {
        link: (children) => `[${children}]`,
      },
      stringRenderer,
    );
    expect(result).toBe('Click [here].');
  });

  it('emits a void tag through its handler with no children', () => {
    const result = walkRichText<string>(
      'Line<br/>break',
      {
        br: () => '\n',
      },
      stringRenderer,
    );
    expect(result).toBe('Line\nbreak');
  });

  it('preserves an unmatched pair tag as literal markers', () => {
    const result = walkRichText<string>(
      'A <foo>bar</foo>.',
      {},
      stringRenderer,
    );
    expect(result).toBe('A <foo>bar</foo>.');
  });

  it('preserves an unmatched void tag as a literal self-closing marker', () => {
    const result = walkRichText<string>('A <foo/> B', {}, stringRenderer);
    expect(result).toBe('A <foo/> B');
  });

  it('walks nested tags through their handlers', () => {
    const result = walkRichText<string>(
      '<outer>x <inner>y</inner> z</outer>',
      {
        inner: (children) => `(${children})`,
        outer: (children) => `[${children}]`,
      },
      stringRenderer,
    );
    expect(result).toBe('[x (y) z]');
  });

  it('walks a void tag inside a pair tag through both handlers', () => {
    const result = walkRichText<string>(
      '<link>click <icon/> here</link>',
      {
        icon: () => '*',
        link: (children) => `[${children}]`,
      },
      stringRenderer,
    );
    expect(result).toBe('[click * here]');
  });
});

describe('properties', () => {
  it.prop([
    fc.string(),
  ])('returns an array of nodes for every input string', (source) => {
    expect(Array.isArray(parseRichText(source))).toBe(true);
  });

  const tagFreeArbitrary = fc.string().filter((s) => !s.includes('<'));

  it.prop([
    tagFreeArbitrary,
  ])(
    'preserves the source as a single text node when no tag marker is present',
    (source) => {
      const result = parseRichText(source);
      if (source === '') {
        expect(result).toEqual([]);
        return;
      }
      expect(result).toEqual([
        {
          type: 'text',
          value: source,
        },
      ]);
    },
  );

  it.prop([
    fc.string(),
  ])('lists no empty text node in the result', (source) => {
    for (const node of parseRichText(source)) {
      if (node.type === 'text') {
        expect(node.value).not.toBe('');
      }
    }
  });

  it('refuses to throw when tag nesting reaches eight thousand levels', () => {
    const source = `${'<b>'.repeat(8000)}x${'</b>'.repeat(8000)}`;
    expect(() => parseRichText(source)).not.toThrow();
  });

  it('returns a text fallback at the deepest level when nesting exceeds the limit', () => {
    const source = `${'<b>'.repeat(8000)}x${'</b>'.repeat(8000)}`;
    const result = parseRichText(source);
    let node: RichTextNode | undefined = result[0];
    while (node?.type === 'pair') {
      node = node.children[0];
    }
    expect(node?.type).toBe('text');
  });

  it('parses nesting up to a thousand levels without falling back', () => {
    const source = `${'<b>'.repeat(1000)}x${'</b>'.repeat(1000)}`;
    const result = parseRichText(source);
    let node: RichTextNode | undefined = result[0];
    let depth = 0;
    while (node?.type === 'pair') {
      node = node.children[0];
      depth += 1;
    }
    expect(node?.type).toBe('text');
    expect(node?.type === 'text' ? node.value : '').toBe('x');
    expect(depth).toBe(1000);
  });
});
