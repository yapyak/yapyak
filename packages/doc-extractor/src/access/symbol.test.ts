import type { Manifest, SymbolEntry } from '../build';

import { describe, expect, it } from 'vitest';

import { resolveSymbol } from './symbol';

const TRANSLATOR_ENTRY: SymbolEntry = {
  collection: 'reference',
  path: 'yapyak/createTranslator',
};

const PROCESSOR_ENTRY: SymbolEntry = {
  collection: 'reference',
  path: 'yapyak/processor/createProcessor',
};

function manifest(symbols: Manifest['symbols']): Manifest {
  return {
    collections: {},
    options: {},
    symbols,
    version: 1,
  };
}

describe('resolveSymbol', () => {
  it('returns the entry when the key matches directly', () => {
    expect(
      resolveSymbol(
        manifest({
          'yapyak/createTranslator': TRANSLATOR_ENTRY,
        }),
        'yapyak/createTranslator',
      ),
    ).toBe(TRANSLATOR_ENTRY);
  });

  it('returns the entry when the bare name matches a single key tail', () => {
    expect(
      resolveSymbol(
        manifest({
          'yapyak/createTranslator': TRANSLATOR_ENTRY,
        }),
        'createTranslator',
      ),
    ).toBe(TRANSLATOR_ENTRY);
  });

  it('returns `undefined` when the bare name matches multiple tails', () => {
    expect(
      resolveSymbol(
        manifest({
          'react/createTranslator': PROCESSOR_ENTRY,
          'yapyak/createTranslator': TRANSLATOR_ENTRY,
        }),
        'createTranslator',
      ),
    ).toBeUndefined();
  });

  it('returns `undefined` when no key matches', () => {
    expect(resolveSymbol(manifest({}), 'createTranslator')).toBeUndefined();
  });
});
