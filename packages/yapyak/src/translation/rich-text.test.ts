import { describe, expect, it } from 'vitest';

import { parseRichText, walkRichText } from './rich-text';

describe('parseRichText', () => {
  it('returns a single text node for a source without tags', () => {
    expect(parseRichText('Save changes')).toEqual([
      {
        text: 'Save changes',
        type: 'text',
      },
    ]);
  });

  it('returns an empty array for an empty source', () => {
    expect(parseRichText('')).toEqual([]);
  });

  it('parses a pair tag with text children', () => {
    expect(parseRichText('Click <link>here</link>.')).toEqual([
      {
        text: 'Click ',
        type: 'text',
      },
      {
        children: [
          {
            text: 'here',
            type: 'text',
          },
        ],
        name: 'link',
        type: 'tag',
      },
      {
        text: '.',
        type: 'text',
      },
    ]);
  });

  it('walks nested pair tags recursively', () => {
    expect(parseRichText('<a>x <b>y</b> z</a>')).toEqual([
      {
        children: [
          {
            text: 'x ',
            type: 'text',
          },
          {
            children: [
              {
                text: 'y',
                type: 'text',
              },
            ],
            name: 'b',
            type: 'tag',
          },
          {
            text: ' z',
            type: 'text',
          },
        ],
        name: 'a',
        type: 'tag',
      },
    ]);
  });

  it('parses a void tag as a void node with no children', () => {
    expect(parseRichText('First<br/>Second')).toEqual([
      {
        text: 'First',
        type: 'text',
      },
      {
        name: 'br',
        type: 'void',
      },
      {
        text: 'Second',
        type: 'text',
      },
    ]);
  });

  it('parses a void tag with a single space before the slash', () => {
    expect(parseRichText('First<br />Second')).toEqual([
      {
        text: 'First',
        type: 'text',
      },
      {
        name: 'br',
        type: 'void',
      },
      {
        text: 'Second',
        type: 'text',
      },
    ]);
  });

  it('parses a void tag with multiple spaces before the slash', () => {
    expect(parseRichText('First<br   />Second')).toEqual([
      {
        text: 'First',
        type: 'text',
      },
      {
        name: 'br',
        type: 'void',
      },
      {
        text: 'Second',
        type: 'text',
      },
    ]);
  });

  it('parses a void tag nested inside a pair tag', () => {
    expect(parseRichText('<link>click <icon/> here</link>')).toEqual([
      {
        children: [
          {
            text: 'click ',
            type: 'text',
          },
          {
            name: 'icon',
            type: 'void',
          },
          {
            text: ' here',
            type: 'text',
          },
        ],
        name: 'link',
        type: 'tag',
      },
    ]);
  });

  it('preserves a tag with attributes as literal text', () => {
    expect(parseRichText('<a href="x">click</a>')).toEqual([
      {
        text: '<a href="x">click</a>',
        type: 'text',
      },
    ]);
  });

  it('preserves an unclosed pair tag as literal text', () => {
    expect(parseRichText('A <link>unclosed string')).toEqual([
      {
        text: 'A <link>unclosed string',
        type: 'text',
      },
    ]);
  });

  it('refuses a tag name containing characters outside `[A-Za-z][A-Za-z0-9]*`', () => {
    expect(parseRichText('<my-link>x</my-link>')).toEqual([
      {
        text: '<my-link>x</my-link>',
        type: 'text',
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
