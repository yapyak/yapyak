import type { Token } from './type';

import { describe, expect, it } from 'vitest';

import { markSvelteBlocks } from './svelte-block';

function brace(): Token {
  return {
    kind: 'punct',
    value: '{',
  };
}

function plain(value: string): Token {
  return {
    kind: 'plain',
    value,
  };
}

function values(tokens: Token[]) {
  return tokens.map((token) => `${token.value}:${token.kind}`);
}

describe('markSvelteBlocks', () => {
  it('lists no token for an empty source', () => {
    expect(markSvelteBlocks([])).toEqual([]);
  });

  it('marks an opening block', () => {
    expect(
      values(
        markSvelteBlocks([
          brace(),
          plain('#snippet'),
        ]),
      ),
    ).toEqual([
      '{:punct',
      '#snippet:keyword',
    ]);
  });

  it('marks a closing block', () => {
    expect(
      values(
        markSvelteBlocks([
          brace(),
          plain('/'),
          plain('snippet'),
        ]),
      ),
    ).toEqual([
      '{:punct',
      '/snippet:keyword',
    ]);
  });

  it('marks a continuation block', () => {
    expect(
      values(
        markSvelteBlocks([
          brace(),
          plain(':'),
          plain('then value'),
        ]),
      ),
    ).toEqual([
      '{:punct',
      ':then:keyword',
      ' value:plain',
    ]);
  });

  it('marks a tag', () => {
    expect(
      values(
        markSvelteBlocks([
          {
            kind: 'jsx-brace',
            value: '{',
          },
          plain('@render'),
        ]),
      ),
    ).toEqual([
      '{:jsx-brace',
      '@render:keyword',
    ]);
  });

  it('splits the expression from the block name', () => {
    expect(
      values(
        markSvelteBlocks([
          brace(),
          plain('#each items'),
        ]),
      ),
    ).toEqual([
      '{:punct',
      '#each:keyword',
      ' items:plain',
    ]);
  });

  it('preserves a name Svelte does not accept', () => {
    expect(
      values(
        markSvelteBlocks([
          brace(),
          plain('#unknown'),
        ]),
      ),
    ).toEqual([
      '{:punct',
      '#unknown:plain',
    ]);
  });

  it('preserves a brace with nothing after it', () => {
    expect(
      values(
        markSvelteBlocks([
          brace(),
        ]),
      ),
    ).toEqual([
      '{:punct',
    ]);
  });
});
