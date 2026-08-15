import { describe, expect, it } from 'vitest';

import { classifyParamKeys } from './param-key';

describe('classifyParamKeys', () => {
  it('returns no differences when every key matches', () => {
    expect(
      classifyParamKeys(
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
    expect(classifyParamKeys([], [])).toEqual({
      extra: [],
      missing: [],
      renames: [],
    });
  });

  it('returns a missing key when params holds no keys', () => {
    expect(
      classifyParamKeys(
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

  it('returns an extra key when the source holds no placeholders', () => {
    expect(
      classifyParamKeys(
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

  it('returns a rename for a misspelled key', () => {
    expect(
      classifyParamKeys(
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

  it('returns a rename for a key missing one character', () => {
    expect(
      classifyParamKeys(
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

  it('returns a rename and a missing key for two placeholders', () => {
    expect(
      classifyParamKeys(
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

  it('returns no rename when the keys are unrelated', () => {
    expect(
      classifyParamKeys(
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

  it('returns no rename for a placeholder shorter than three characters', () => {
    expect(
      classifyParamKeys(
        [
          'id',
        ],
        [
          'ib',
        ],
      ).renames,
    ).toEqual([]);
  });

  it('returns one rename per key', () => {
    expect(
      classifyParamKeys(
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
