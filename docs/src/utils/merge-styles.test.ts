import { describe, expect, it } from 'vitest';

import { mergeStyles } from './merge-styles';

describe('mergeStyles', () => {
  it('folds two style objects into one record', () => {
    expect(
      mergeStyles(
        {
          color: 'red',
        },
        {
          margin: 4,
        },
      ),
    ).toEqual({
      color: 'red',
      margin: 4,
    });
  });

  it('folds a nested array of style objects', () => {
    expect(
      mergeStyles([
        {
          color: 'red',
        },
        [
          {
            margin: 4,
          },
        ],
      ]),
    ).toEqual({
      color: 'red',
      margin: 4,
    });
  });

  it('returns the later value when the same key is set twice', () => {
    expect(
      mergeStyles(
        {
          color: 'red',
        },
        {
          color: 'blue',
        },
      ),
    ).toEqual({
      color: 'blue',
    });
  });

  it('returns no entry when the value is `null`', () => {
    expect(
      mergeStyles({
        color: null,
      }),
    ).toEqual({});
  });

  it('returns no entry when the value is `false`', () => {
    expect(
      mergeStyles({
        color: false,
      }),
    ).toEqual({});
  });

  it('returns an empty record when no style is provided', () => {
    expect(mergeStyles()).toEqual({});
  });
});
