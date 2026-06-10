import type { Processor } from '../../../processor';

import { describe, expect, it } from 'vitest';

import { resolveProcessor } from './resolve';
import { vanillaProcessor } from './vanilla';

function makeProcessor(id: string, extensions: string[]): Processor {
  return {
    applyImport: () => {},
    extensions,
    id,
    parseFragments: () => [],
  };
}

describe('resolveProcessor', () => {
  it('resolves the vanilla processor when no custom processors are provided', () => {
    expect(resolveProcessor('src/a.ts', 'const x = 1;', [])).toBe(
      vanillaProcessor,
    );
  });

  it('resolves a custom processor when its extension matches the fileId', () => {
    const vue = makeProcessor('vue', [
      '.vue',
    ]);
    expect(
      resolveProcessor('src/a.vue', '<template></template>', [
        vue,
      ]),
    ).toBe(vue);
  });

  it('resolves the vanilla processor when no custom extension matches', () => {
    const vue = makeProcessor('vue', [
      '.vue',
    ]);
    expect(
      resolveProcessor('src/a.ts', 'const x = 1;', [
        vue,
      ]),
    ).toBe(vanillaProcessor);
  });

  it('resolves the vanilla processor when the source is already compiled', () => {
    const vue = makeProcessor('vue', [
      '.vue',
    ]);
    expect(
      resolveProcessor('src/a.vue', "import { x } from 'y';", [
        vue,
      ]),
    ).toBe(vanillaProcessor);
  });
});
