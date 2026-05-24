import { describe, expect, it } from 'vitest';

import { getProcessor, resolveFramework, vanillaProcessor } from './index';

describe('resolveFramework', () => {
  it('detects vue from .vue extension', () => {
    expect(resolveFramework('src/app.vue')).toBe('vue');
  });

  it('detects svelte from .svelte extension', () => {
    expect(resolveFramework('src/app.svelte')).toBe('svelte');
  });

  it('detects astro from .astro extension', () => {
    expect(resolveFramework('src/page.astro')).toBe('astro');
  });

  it('falls back to vanilla for .ts / .tsx / .js / .jsx', () => {
    expect(resolveFramework('src/app.ts')).toBe('vanilla');
    expect(resolveFramework('src/app.tsx')).toBe('vanilla');
    expect(resolveFramework('src/app.js')).toBe('vanilla');
    expect(resolveFramework('src/app.jsx')).toBe('vanilla');
  });

  it('falls back to vanilla for unknown extensions', () => {
    expect(resolveFramework('Makefile')).toBe('vanilla');
    expect(resolveFramework('src/app.md')).toBe('vanilla');
  });
});

describe('getProcessor', () => {
  it('returns vanillaProcessor for vanilla framework', () => {
    expect(getProcessor('vanilla')).toBe(vanillaProcessor);
  });

  it('throws for unimplemented frameworks', () => {
    expect(() => getProcessor('vue')).toThrow(/not yet implemented/);
    expect(() => getProcessor('svelte')).toThrow(/not yet implemented/);
    expect(() => getProcessor('astro')).toThrow(/not yet implemented/);
  });
});
