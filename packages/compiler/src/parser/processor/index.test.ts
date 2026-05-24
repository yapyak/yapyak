import { describe, expect, it } from 'vitest';

import { getProcessor, resolveProcessorKind, vanillaProcessor } from './index';

describe('resolveProcessorKind', () => {
  it('detects vue from .vue extension', () => {
    expect(resolveProcessorKind('src/app.vue')).toBe('vue');
  });

  it('detects svelte from .svelte extension', () => {
    expect(resolveProcessorKind('src/app.svelte')).toBe('svelte');
  });

  it('detects astro from .astro extension', () => {
    expect(resolveProcessorKind('src/page.astro')).toBe('astro');
  });

  it('falls back to vanilla for .ts / .tsx / .js / .jsx', () => {
    expect(resolveProcessorKind('src/app.ts')).toBe('vanilla');
    expect(resolveProcessorKind('src/app.tsx')).toBe('vanilla');
    expect(resolveProcessorKind('src/app.js')).toBe('vanilla');
    expect(resolveProcessorKind('src/app.jsx')).toBe('vanilla');
  });

  it('falls back to vanilla for unknown extensions', () => {
    expect(resolveProcessorKind('Makefile')).toBe('vanilla');
    expect(resolveProcessorKind('src/app.md')).toBe('vanilla');
  });
});

describe('getProcessor', () => {
  it('returns vanillaProcessor for vanilla kind', () => {
    expect(getProcessor('vanilla')).toBe(vanillaProcessor);
  });

  it('returns vueProcessor for vue kind', () => {
    expect(getProcessor('vue')).toBeDefined();
  });

  it('returns svelteProcessor for svelte kind', () => {
    expect(getProcessor('svelte')).toBeDefined();
  });

  it('throws for unimplemented kinds', () => {
    expect(() => getProcessor('astro')).toThrow(/not yet implemented/);
  });
});
