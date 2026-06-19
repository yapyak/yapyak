import type { Token } from './type';

import { describe, expect, it } from 'vitest';

import { applyTypePositions } from './type-position';

describe('applyTypePositions', () => {
  it('marks an identifier after `:` as `type`', () => {
    const tokens: Token[] = [
      {
        type: 'plain',
        value: 'value',
      },
      {
        type: 'punct',
        value: ':',
      },
      {
        type: 'plain',
        value: ' ',
      },
      {
        type: 'plain',
        value: 'Hello',
      },
    ];
    applyTypePositions(tokens);
    expect(tokens[3]?.type).toBe('type');
  });

  it('marks an identifier after `extends` as `type`', () => {
    const tokens: Token[] = [
      {
        type: 'keyword',
        value: 'extends',
      },
      {
        type: 'plain',
        value: ' ',
      },
      {
        type: 'plain',
        value: 'Hello',
      },
    ];
    applyTypePositions(tokens);
    expect(tokens[2]?.type).toBe('type');
  });

  it('marks an identifier inside a generic `<...>` as `type`', () => {
    const tokens: Token[] = [
      {
        type: 'plain',
        value: 'Settings',
      },
      {
        type: 'punct',
        value: '<',
      },
      {
        type: 'plain',
        value: 'Hello',
      },
      {
        type: 'punct',
        value: '>',
      },
    ];
    applyTypePositions(tokens);
    expect(tokens[2]?.type).toBe('type');
  });

  it('preserves a lowercase identifier after `:`', () => {
    const tokens: Token[] = [
      {
        type: 'plain',
        value: 'value',
      },
      {
        type: 'punct',
        value: ':',
      },
      {
        type: 'plain',
        value: ' ',
      },
      {
        type: 'plain',
        value: 'hello',
      },
    ];
    applyTypePositions(tokens);
    expect(tokens[3]?.type).toBe('plain');
  });
});
