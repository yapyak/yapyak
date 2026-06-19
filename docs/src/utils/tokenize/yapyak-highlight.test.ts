import type { Token } from './type';

import { describe, expect, it } from 'vitest';

import { applyYapyakHighlight } from './yapyak-highlight';

describe('applyYapyakHighlight', () => {
  it('marks a `yapyak` import string as `tx-yapyak`', () => {
    const tokens: Token[] = [
      {
        type: 'keyword',
        value: 'from',
      },
      {
        type: 'plain',
        value: ' ',
      },
      {
        type: 'string',
        value: "'yapyak'",
      },
    ];
    applyYapyakHighlight(tokens);
    expect(tokens[2]?.type).toBe('tx-yapyak');
  });

  it('marks a subpath `yapyak/internal` import string as `tx-yapyak`', () => {
    const tokens: Token[] = [
      {
        type: 'string',
        value: "'yapyak/internal'",
      },
    ];
    applyYapyakHighlight(tokens);
    expect(tokens[0]?.type).toBe('tx-yapyak');
  });

  it('marks the source string in a `t()` call as `tx-source`', () => {
    const tokens: Token[] = [
      {
        type: 'fn-call',
        value: 't',
      },
      {
        type: 'punct',
        value: '(',
      },
      {
        type: 'string',
        value: "'Hello'",
      },
      {
        type: 'punct',
        value: ')',
      },
    ];
    applyYapyakHighlight(tokens);
    expect(tokens[0]?.type).toBe('tx-call');
    expect(tokens[2]?.type).toBe('tx-source');
  });

  it('preserves a dotted-key `t()` argument as a plain string', () => {
    const tokens: Token[] = [
      {
        type: 'fn-call',
        value: 't',
      },
      {
        type: 'punct',
        value: '(',
      },
      {
        type: 'string',
        value: "'page.settings.title'",
      },
      {
        type: 'punct',
        value: ')',
      },
    ];
    applyYapyakHighlight(tokens);
    expect(tokens[2]?.type).toBe('string');
  });

  it('marks the second argument of `t.as()` as `tx-source`', () => {
    const tokens: Token[] = [
      {
        type: 'fn-call',
        value: 't',
      },
      {
        type: 'punct',
        value: '.',
      },
      {
        type: 'keyword',
        value: 'as',
      },
      {
        type: 'punct',
        value: '(',
      },
      {
        type: 'string',
        value: "'button'",
      },
      {
        type: 'punct',
        value: ',',
      },
      {
        type: 'plain',
        value: ' ',
      },
      {
        type: 'string',
        value: "'Cancel'",
      },
      {
        type: 'punct',
        value: ')',
      },
    ];
    applyYapyakHighlight(tokens);
    expect(tokens[7]?.type).toBe('tx-source');
  });

  it('marks every string inside a `_$pick()` call as `tx-source`', () => {
    const tokens: Token[] = [
      {
        type: 'fn-call',
        value: '_$pick',
      },
      {
        type: 'punct',
        value: '(',
      },
      {
        type: 'string',
        value: "'Hello'",
      },
      {
        type: 'punct',
        value: ',',
      },
      {
        type: 'string',
        value: "'World'",
      },
      {
        type: 'punct',
        value: ')',
      },
    ];
    applyYapyakHighlight(tokens);
    expect(tokens[2]?.type).toBe('tx-source');
    expect(tokens[4]?.type).toBe('tx-source');
  });
});
