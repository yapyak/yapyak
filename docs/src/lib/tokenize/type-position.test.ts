import type { Token } from './type';

import { describe, expect, it } from 'vitest';

import { applyTypePositions } from './type-position';

describe('applyTypePositions', () => {
  it('marks an identifier after `:` as `type`', () => {
    const tokens: Token[] = [
      {
        kind: 'plain',
        value: 'value',
      },
      {
        kind: 'punct',
        value: ':',
      },
      {
        kind: 'plain',
        value: ' ',
      },
      {
        kind: 'plain',
        value: 'Hello',
      },
    ];
    applyTypePositions(tokens);
    expect(tokens[3]?.kind).toBe('type');
  });

  it('marks an identifier after `extends` as `type`', () => {
    const tokens: Token[] = [
      {
        kind: 'keyword',
        value: 'extends',
      },
      {
        kind: 'plain',
        value: ' ',
      },
      {
        kind: 'plain',
        value: 'Hello',
      },
    ];
    applyTypePositions(tokens);
    expect(tokens[2]?.kind).toBe('type');
  });

  it('marks an identifier inside a generic `<...>` as `type`', () => {
    const tokens: Token[] = [
      {
        kind: 'plain',
        value: 'Settings',
      },
      {
        kind: 'punct',
        value: '<',
      },
      {
        kind: 'plain',
        value: 'Hello',
      },
      {
        kind: 'punct',
        value: '>',
      },
    ];
    applyTypePositions(tokens);
    expect(tokens[2]?.kind).toBe('type');
  });

  it('preserves a lowercase identifier after `:`', () => {
    const tokens: Token[] = [
      {
        kind: 'plain',
        value: 'value',
      },
      {
        kind: 'punct',
        value: ':',
      },
      {
        kind: 'plain',
        value: ' ',
      },
      {
        kind: 'plain',
        value: 'hello',
      },
    ];
    applyTypePositions(tokens);
    expect(tokens[3]?.kind).toBe('plain');
  });
});
