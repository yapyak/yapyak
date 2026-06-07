import type { Processor } from '../../processor';
import type { ContextLevel, Translator } from '../../translator';

import { describe, expect, it } from 'vitest';

import { createProcessor } from '../../processor';
import { createTranslator } from '../../translator';
import { normalizeYapyakConfig } from './normalize';

function makeTranslator(context?: ContextLevel): Translator {
  const options: Parameters<typeof createTranslator>[0] = {
    translate: () => [],
  };
  if (context !== undefined) {
    options.context = context;
  }
  return createTranslator(options);
}

describe('normalizeYapyakConfig', () => {
  it('returns the default examples count when no translator is configured', () => {
    const result = normalizeYapyakConfig({});

    expect(result.examples).toBe(5);
  });

  it('returns the default examples count for a translator without an explicit context', () => {
    const result = normalizeYapyakConfig({ translator: makeTranslator() });

    expect(result.examples).toBe(5);
  });

  it('returns the default examples count for a minimal-context translator', () => {
    const result = normalizeYapyakConfig({
      translator: makeTranslator('minimal'),
    });

    expect(result.examples).toBe(5);
  });

  it('returns zero examples when the translator opts out of call-site context', () => {
    const result = normalizeYapyakConfig({
      translator: makeTranslator('none'),
    });

    expect(result.examples).toBe(0);
  });

  it('preserves an explicit examples count over the context-derived default', () => {
    const result = normalizeYapyakConfig({
      examples: 3,
      translator: makeTranslator('none'),
    });

    expect(result.examples).toBe(3);
  });

  it('preserves an explicit zero examples count regardless of translator context', () => {
    const result = normalizeYapyakConfig({
      examples: 0,
      translator: makeTranslator('rich'),
    });

    expect(result.examples).toBe(0);
  });

  it('holds only vanilla extensions in the include glob when no processors are registered', () => {
    const result = normalizeYapyakConfig({});

    expect(result.include).toEqual(['**/*.{cjs,cts,js,jsx,mjs,mts,ts,tsx}']);
  });

  it("builds the include glob from each registered processor's extensions", () => {
    const result = normalizeYapyakConfig({
      processors: [makeProcessor('svelte', ['.svelte'])],
    });

    expect(result.include).toEqual([
      '**/*.{cjs,cts,js,jsx,mjs,mts,svelte,ts,tsx}',
    ]);
  });

  it('builds the include glob from extensions across multiple processors', () => {
    const result = normalizeYapyakConfig({
      processors: [
        makeProcessor('svelte', ['.svelte']),
        makeProcessor('vue', ['.vue']),
      ],
    });

    expect(result.include).toEqual([
      '**/*.{cjs,cts,js,jsx,mjs,mts,svelte,ts,tsx,vue}',
    ]);
  });

  it('folds overlapping extensions across processors into a single glob entry', () => {
    const result = normalizeYapyakConfig({
      processors: [makeProcessor('custom', ['.ts', '.svelte'])],
    });

    expect(result.include).toEqual([
      '**/*.{cjs,cts,js,jsx,mjs,mts,svelte,ts,tsx}',
    ]);
  });

  it('preserves an explicit include over the derived default', () => {
    const result = normalizeYapyakConfig({
      include: ['src/**/*.ts'],
      processors: [makeProcessor('svelte', ['.svelte'])],
    });

    expect(result.include).toEqual(['src/**/*.ts']);
  });
});

function makeProcessor(id: string, extensions: string[]): Processor {
  return createProcessor({
    applyImport: () => undefined,
    extensions,
    id,
    parseFragments: () => [],
  });
}
