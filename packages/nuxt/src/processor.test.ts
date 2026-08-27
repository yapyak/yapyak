import { describe, expect, it } from 'vitest';

import { nuxt } from './processor';

describe('nuxt', () => {
  describe('with defaults', () => {
    it('returns the Vue and vanilla processors with `t` ambient', () => {
      const processors = nuxt();
      expect(processors.map((processor) => processor.id)).toEqual([
        'vue',
        'vanilla',
      ]);
      for (const processor of processors) {
        expect(processor.ambientBindings).toEqual([
          't',
        ]);
      }
    });

    it('lists `.vue` and the vanilla script extensions', () => {
      const extensions = nuxt().flatMap((processor) => processor.extensions);
      expect(extensions).toContain('.vue');
      expect(extensions).toContain('.ts');
      expect(extensions).toContain('.tsx');
    });
  });

  describe('with overrides', () => {
    it('returns no ambient bindings with `explicitImports`', () => {
      const processors = nuxt({
        explicitImports: true,
      });
      for (const processor of processors) {
        expect(processor.ambientBindings).toBeUndefined();
      }
    });

    it('preserves the shared vanilla processor', () => {
      const [, vanilla] = nuxt();
      expect(vanilla?.ambientBindings).toEqual([
        't',
      ]);
      const [, plain] = nuxt({
        explicitImports: true,
      });
      expect(plain?.ambientBindings).toBeUndefined();
    });
  });
});
