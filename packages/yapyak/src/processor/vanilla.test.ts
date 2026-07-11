import { describe, expect, it } from 'vitest';

import { vanillaProcessor } from './vanilla';

describe('vanillaProcessor', () => {
  it('returns a processor with the `vanilla` id', () => {
    expect(vanillaProcessor.id).toBe('vanilla');
  });

  it('returns a processor handling plain TS/JS extensions', () => {
    expect(vanillaProcessor.extensions).toEqual([
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.mts',
      '.mjs',
      '.cts',
      '.cjs',
    ]);
  });

  it('refuses to declare a parseFragments hook — the transform default applies', () => {
    expect(vanillaProcessor.parseFragments).toBeUndefined();
  });

  it('refuses to declare an applyImport hook — the transform default applies', () => {
    expect(vanillaProcessor.applyImport).toBeUndefined();
  });

  it('refuses to declare a runtime binding — plain TS/JS files need no HMR wiring', () => {
    expect(vanillaProcessor.runtime).toBeUndefined();
  });
});
