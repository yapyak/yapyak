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

  it('returns the cached messages when an unchanged source has no call sites', () => {
    const state = buildState();
    const source = "import { t } from 'yapyak';\nexport { t };";
    const first = resolveExtraction(state, 'src/a.ts', source);

    expect(resolveExtraction(state, 'src/a.ts', source).messages).toBe(
      first.messages,
    );
  });

  it('extracts the call sites again when an unchanged source has call sites', () => {
    const state = buildState();
    const source = "import { t } from 'yapyak';\nt('Hello');";
    const first = resolveExtraction(state, 'src/a.ts', source);
    const second = resolveExtraction(state, 'src/a.ts', source);

    expect(second.callSites).toHaveLength(1);
    expect(second.messages).toEqual(first.messages);
  });

  it('clears the cached entry when the source stops mentioning `yapyak`', () => {
    const state = buildState();
    resolveExtraction(
      state,
      'src/a.ts',
      "import { t } from 'yapyak';\nt('Hello');",
    );

    resolveExtraction(state, 'src/a.ts', 'export const label = 1;');

    expect(state.extractionCache.has('src/a.ts')).toBe(false);
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

  it('extracts unbound calls when a processor declares ambient bindings', () => {
    const state = createState();
    state.normalized = normalizeYapyakConfig({
      processors: [
        {
          ambientBindings: [
            't',
          ],
          extensions: [
            '.ts',
          ],
          id: 'ambient',
        },
      ],
    });
    const result = resolveExtraction(state, 'src/a.ts', "t('Hello');");

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]?.source).toBe('Hello');
  });
});
