import { describe, expect, it } from 'vitest';

import { classifyNames } from './name';

describe('classifyNames', () => {
  it('returns no differences when every name matches', () => {
    expect(
      classifyNames(
        [
          'name',
        ],
        [
          'name',
        ],
      ),
    ).toEqual({
      extra: [],
      missing: [],
      renames: [],
    });
  });

  it('returns no differences for two empty arrays', () => {
    expect(classifyNames([], [])).toEqual({
      extra: [],
      missing: [],
      renames: [],
    });
  });

  it('returns a missing name when the actual list is empty', () => {
    expect(
      classifyNames(
        [
          'name',
        ],
        [],
      ),
    ).toEqual({
      extra: [],
      missing: [
        'name',
      ],
      renames: [],
    });
  });

  it('returns an extra name when the expected list is empty', () => {
    expect(
      classifyNames(
        [],
        [
          'author',
        ],
      ),
    ).toEqual({
      extra: [
        'author',
      ],
      missing: [],
      renames: [],
    });
  });

  it('returns a rename for a misspelled name', () => {
    expect(
      classifyNames(
        [
          'count',
        ],
        [
          'conut',
        ],
      ),
    ).toEqual({
      extra: [],
      missing: [],
      renames: [
        {
          from: 'conut',
          to: 'count',
        },
      ],
    });
  });

  it('returns a rename for a name missing one character', () => {
    expect(
      classifyNames(
        [
          'amount',
        ],
        [
          'amont',
        ],
      ).renames,
    ).toEqual([
      {
        from: 'amont',
        to: 'amount',
      },
    ]);
  });

  it('returns a rename and a missing name for two expected names', () => {
    expect(
      classifyNames(
        [
          'author',
          'count',
        ],
        [
          'autor',
        ],
      ),
    ).toEqual({
      extra: [],
      missing: [
        'count',
      ],
      renames: [
        {
          from: 'autor',
          to: 'author',
        },
      ],
    });
  });

  it('returns no rename when the names are unrelated', () => {
    expect(
      classifyNames(
        [
          'name',
        ],
        [
          'author',
        ],
      ),
    ).toEqual({
      extra: [
        'author',
      ],
      missing: [
        'name',
      ],
      renames: [],
    });
  });

  it('returns no rename for a name shorter than three characters', () => {
    expect(
      classifyNames(
        [
          'id',
        ],
        [
          'ib',
        ],
      ).renames,
    ).toEqual([]);
  });

  it('returns one rename per name', () => {
    expect(
      classifyNames(
        [
          'count',
          'amount',
        ],
        [
          'conut',
          'amont',
        ],
      ).renames,
    ).toEqual([
      {
        from: 'conut',
        to: 'count',
      },
      {
        from: 'amont',
        to: 'amount',
      },
    ]);
  });
});
