import type { Token } from './type';

import { describe, expect, it } from 'vitest';

import { applyYapyakHighlight } from './yapyak-highlight';

describe('applyYapyakHighlight', () => {
  it('marks a `yapyak` import string as `tx-yapyak`', () => {
    const tokens: Token[] = [
      {
        kind: 'keyword',
        value: 'from',
      },
      {
        kind: 'plain',
        value: ' ',
      },
      {
        kind: 'string',
        value: "'yapyak'",
      },
    ];
    applyYapyakHighlight(tokens);
    expect(tokens[2]?.kind).toBe('tx-yapyak');
  });

  it('marks a subpath `yapyak/internal` import string as `tx-yapyak`', () => {
    const tokens: Token[] = [
      {
        kind: 'string',
        value: "'yapyak/internal'",
      },
    ];
    applyYapyakHighlight(tokens);
    expect(tokens[0]?.kind).toBe('tx-yapyak');
  });

  it('marks the source string in a `t()` call as `tx-source`', () => {
    const tokens: Token[] = [
      {
        kind: 'fn-call',
        value: 't',
      },
      {
        kind: 'punct',
        value: '(',
      },
      {
        kind: 'string',
        value: "'Hello'",
      },
      {
        kind: 'punct',
        value: ')',
      },
    ];
    applyYapyakHighlight(tokens);
    expect(tokens[0]?.kind).toBe('tx-call');
    expect(tokens[2]?.kind).toBe('tx-source');
  });

  it('preserves a dotted-key `t()` argument as a plain string', () => {
    const tokens: Token[] = [
      {
        kind: 'fn-call',
        value: 't',
      },
      {
        kind: 'punct',
        value: '(',
      },
      {
        kind: 'string',
        value: "'page.settings.title'",
      },
      {
        kind: 'punct',
        value: ')',
      },
    ];
    applyYapyakHighlight(tokens);
    expect(tokens[2]?.kind).toBe('string');
  });

  it('marks the second argument of `t.as()` as `tx-source`', () => {
    const tokens: Token[] = [
      {
        kind: 'fn-call',
        value: 't',
      },
      {
        kind: 'punct',
        value: '.',
      },
      {
        kind: 'keyword',
        value: 'as',
      },
      {
        kind: 'punct',
        value: '(',
      },
      {
        kind: 'string',
        value: "'button'",
      },
      {
        kind: 'punct',
        value: ',',
      },
      {
        kind: 'plain',
        value: ' ',
      },
      {
        kind: 'string',
        value: "'Cancel'",
      },
      {
        kind: 'punct',
        value: ')',
      },
    ];
    applyYapyakHighlight(tokens);
    expect(tokens[7]?.kind).toBe('tx-source');
  });

  it('marks the source argument of a chained `t.in().as()` as `tx-source`', () => {
    const tokens: Token[] = [
      {
        kind: 'fn-call',
        value: 't',
      },
      {
        kind: 'punct',
        value: '.',
      },
      {
        kind: 'keyword',
        value: 'in',
      },
      {
        kind: 'punct',
        value: '(',
      },
      {
        kind: 'string',
        value: "'sv'",
      },
      {
        kind: 'punct',
        value: ')',
      },
      {
        kind: 'punct',
        value: '.',
      },
      {
        kind: 'keyword',
        value: 'as',
      },
      {
        kind: 'punct',
        value: '(',
      },
      {
        kind: 'string',
        value: "'button'",
      },
      {
        kind: 'punct',
        value: ',',
      },
      {
        kind: 'plain',
        value: ' ',
      },
      {
        kind: 'string',
        value: "'Open'",
      },
      {
        kind: 'punct',
        value: ')',
      },
    ];
    applyYapyakHighlight(tokens);
    expect(tokens[4]?.kind).toBe('string');
    expect(tokens[9]?.kind).toBe('string');
    expect(tokens[12]?.kind).toBe('tx-source');
  });

  it('marks the source argument of a chained `t.as().in()` as `tx-source`', () => {
    const tokens: Token[] = [
      {
        kind: 'fn-call',
        value: 't',
      },
      {
        kind: 'punct',
        value: '.',
      },
      {
        kind: 'keyword',
        value: 'as',
      },
      {
        kind: 'punct',
        value: '(',
      },
      {
        kind: 'string',
        value: "'button'",
      },
      {
        kind: 'punct',
        value: ')',
      },
      {
        kind: 'punct',
        value: '.',
      },
      {
        kind: 'keyword',
        value: 'in',
      },
      {
        kind: 'punct',
        value: '(',
      },
      {
        kind: 'string',
        value: "'sv'",
      },
      {
        kind: 'punct',
        value: ',',
      },
      {
        kind: 'plain',
        value: ' ',
      },
      {
        kind: 'string',
        value: "'Open'",
      },
      {
        kind: 'punct',
        value: ')',
      },
    ];
    applyYapyakHighlight(tokens);
    expect(tokens[4]?.kind).toBe('string');
    expect(tokens[9]?.kind).toBe('string');
    expect(tokens[12]?.kind).toBe('tx-source');
  });

  it('marks every string inside a `_$pick()` call as `tx-source`', () => {
    const tokens: Token[] = [
      {
        kind: 'fn-call',
        value: '_$pick',
      },
      {
        kind: 'punct',
        value: '(',
      },
      {
        kind: 'string',
        value: "'Hello'",
      },
      {
        kind: 'punct',
        value: ',',
      },
      {
        kind: 'string',
        value: "'World'",
      },
      {
        kind: 'punct',
        value: ')',
      },
    ];
    applyYapyakHighlight(tokens);
    expect(tokens[2]?.kind).toBe('tx-source');
    expect(tokens[4]?.kind).toBe('tx-source');
  });
});
