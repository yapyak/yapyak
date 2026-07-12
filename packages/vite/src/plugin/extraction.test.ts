import type { State } from './state';

import { describe, expect, it } from 'vitest';
import { normalizeYapyakConfig } from 'yapyak/config/internal';

import { resolveExtraction } from './extraction';
import { createState } from './state';

function buildState(): State {
  const state = createState();
  state.normalized = normalizeYapyakConfig({});
  return state;
}

describe('resolveExtraction', () => {
  it('extracts messages for a `t()` call', () => {
    const state = buildState();
    const result = resolveExtraction(
      state,
      'src/a.ts',
      "import { t } from 'yapyak';\nt('Hello');",
    );

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]?.source).toBe('Hello');
  });

  it('returns the cached result when the source is unchanged', () => {
    const state = buildState();
    const source = "import { t } from 'yapyak';\nt('Hello');";
    const first = resolveExtraction(state, 'src/a.ts', source);

    expect(resolveExtraction(state, 'src/a.ts', source)).toBe(first);
  });

  it('returns an empty result when the source lacks `yapyak`', () => {
    const state = buildState();

    expect(
      resolveExtraction(state, 'src/a.ts', "t('Hello');").messages,
    ).toEqual([]);
  });

  it('returns an empty result when the source is empty', () => {
    const state = buildState();

    expect(resolveExtraction(state, 'src/a.ts', '').messages).toEqual([]);
  });
});
