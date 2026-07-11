import { describe, expect, it } from 'vitest';
import { normalizeYapyakConfig } from 'yapyak/config/internal';

import { isLocaleFile } from './locale-file';
import { createState } from './state';

describe('isLocaleFile', () => {
  it('returns true for a JSON file in the locales directory', () => {
    const state = createState();
    state.normalized = normalizeYapyakConfig({});
    state.projectRoot = '/project';

    expect(isLocaleFile(state, '/project/locales/sv.json')).toBe(true);
  });

  it('returns false for a JSON file outside the locales directory', () => {
    const state = createState();
    state.normalized = normalizeYapyakConfig({});
    state.projectRoot = '/project';

    expect(isLocaleFile(state, '/project/src/sv.json')).toBe(false);
  });
});
