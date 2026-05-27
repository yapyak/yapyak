import { describe, expect, it } from 'vitest';

import { getProcessor, resolveProcessorKind, vanillaProcessor } from './index';

describe('getProcessor', () => {
  it('returns `vanillaProcessor` for vanilla kind', () => {
    expect(getProcessor('vanilla')).toBe(vanillaProcessor);
  });

  it('returns `vueProcessor` for vue kind', () => {
    expect(getProcessor('vue')).toBeDefined();
  });

  it('returns `svelteProcessor` for svelte kind', () => {
    expect(getProcessor('svelte')).toBeDefined();
  });

  it('returns `astroProcessor` for astro kind', () => {
    expect(getProcessor('astro')).toBeDefined();
  });
});

describe('resolveProcessorKind', () => {
  it('returns vue for `.vue` extension', () => {
    expect(resolveProcessorKind('src/a.vue')).toBe('vue');
  });

  it('returns svelte for `.svelte` extension', () => {
    expect(resolveProcessorKind('src/a.svelte')).toBe('svelte');
  });

  it('returns astro for `.astro` extension', () => {
    expect(resolveProcessorKind('src/a.astro')).toBe('astro');
  });

  it('returns vanilla for `.ts` / `.tsx` / `.js` / `.jsx`', () => {
    expect(resolveProcessorKind('src/a.ts')).toBe('vanilla');
    expect(resolveProcessorKind('src/a.tsx')).toBe('vanilla');
    expect(resolveProcessorKind('src/a.js')).toBe('vanilla');
    expect(resolveProcessorKind('src/a.jsx')).toBe('vanilla');
  });

  it('returns vanilla for unknown extensions', () => {
    expect(resolveProcessorKind('Makefile')).toBe('vanilla');
    expect(resolveProcessorKind('src/a.md')).toBe('vanilla');
  });
});
