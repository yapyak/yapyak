import type { Manifest } from '../build';
import type { OptionsRegistry } from '../config';

import { describe, expect, it } from 'vitest';

import { getOptions, getOptionsGroup } from './options';

function manifest(options: OptionsRegistry): Manifest {
  return {
    collections: {},
    options,
    symbols: {},
    version: 1,
  };
}

const FRAMEWORK_GROUP = {
  default: 'react',
  label: 'Settings',
  options: [
    {
      label: 'react',
      value: 'react',
    },
  ],
};

describe('getOptions', () => {
  it('returns the options registry', () => {
    expect(
      getOptions(
        manifest({
          framework: FRAMEWORK_GROUP,
        }),
      ),
    ).toEqual({
      framework: FRAMEWORK_GROUP,
    });
  });
});

describe('getOptionsGroup', () => {
  it('returns the group when found', () => {
    expect(
      getOptionsGroup(
        manifest({
          framework: FRAMEWORK_GROUP,
        }),
        'framework',
      ),
    ).toBe(FRAMEWORK_GROUP);
  });

  it('returns `undefined` when not found', () => {
    expect(getOptionsGroup(manifest({}), 'missing')).toBeUndefined();
  });
});
