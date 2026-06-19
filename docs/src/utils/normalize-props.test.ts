import { describe, expect, it } from 'vitest';

import { normalizeProps } from './normalize-props';

describe('normalizeProps', () => {
  it('normalizes a `data-*` prop with `true` to an empty string', () => {
    expect(
      normalizeProps({
        'data-active': true,
      }),
    ).toEqual({
      'data-active': '',
    });
  });

  it('normalizes a `data-*` prop with `false` to `undefined`', () => {
    expect(
      normalizeProps({
        'data-active': false,
      }),
    ).toEqual({
      'data-active': undefined,
    });
  });

  it('preserves a non-boolean `data-*` prop unchanged', () => {
    expect(
      normalizeProps({
        'data-label': 'Hello',
      }),
    ).toEqual({
      'data-label': 'Hello',
    });
  });

  it('preserves a non-`data-*` prop unchanged', () => {
    expect(
      normalizeProps({
        className: 'Hello',
      }),
    ).toEqual({
      className: 'Hello',
    });
  });
});
