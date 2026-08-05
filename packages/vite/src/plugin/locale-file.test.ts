import { describe, expect, it } from 'vitest';
import { normalizeYapyakConfig } from 'yapyak/config/internal';

import { isLocaleFile } from './locale-file';
import { createState } from './state';

describe('isLocaleFile', () => {
  it('returns true when the path is a JSON file in the locales directory', () => {
    const state = createState();
    state.normalized = normalizeYapyakConfig({});
    state.projectRoot = '/project';

    expect(isLocaleFile(state, '/project/locales/sv.json')).toBe(true);
  });

  it('returns false when the path is outside the locales directory', () => {
    const state = createState();
    state.normalized = normalizeYapyakConfig({});
    state.projectRoot = '/project';

    expect(isLocaleFile(state, '/project/src/sv.json')).toBe(false);
  });
});
