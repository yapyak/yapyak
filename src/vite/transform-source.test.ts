import { describe, expect, it } from 'vitest';
import { transformSource } from './transform-source';

const factories = new Set(['intl']);

describe('transformSource', () => {
  it('injects fileId into single-arg t() call', () => {
    const result = transformSource({
      code: `intl.t('Welcome!')`,
      factoryNames: factories,
      fileId: 'src/header.tsx',
    });
    expect(result.code).toBe(`intl.t('Welcome!', undefined, "src/header.tsx")`);
    expect(result.count).toBe(1);
  });

  it('injects fileId into two-arg t() call', () => {
    const result = transformSource({
      code: `intl.t('Hello, {name}!', { name: 'X' })`,
      factoryNames: factories,
      fileId: 'src/header.tsx',
    });
    expect(result.code).toBe(
      `intl.t('Hello, {name}!', { name: 'X' }, "src/header.tsx")`,
    );
  });

  it('replaces existing fileId argument', () => {
    const result = transformSource({
      code: `intl.t('Hi', undefined, "old/path.tsx")`,
      factoryNames: factories,
      fileId: 'new/path.tsx',
    });
    expect(result.code).toBe(`intl.t('Hi', undefined, "new/path.tsx")`);
  });

  it('handles multiple t() calls in same file', () => {
    const result = transformSource({
      code: `intl.t('A'); intl.t('B', { x: 1 });`,
      factoryNames: factories,
      fileId: 'f.tsx',
    });
    expect(result.count).toBe(2);
    expect(result.code).toContain(`intl.t('A', undefined, "f.tsx")`);
    expect(result.code).toContain(`intl.t('B', { x: 1 }, "f.tsx")`);
  });

  it('ignores non-factory namespaces', () => {
    const result = transformSource({
      code: `other.t('skip'); intl.t('take')`,
      factoryNames: factories,
      fileId: 'f.tsx',
    });
    expect(result.count).toBe(1);
    expect(result.code).toContain(`other.t('skip')`);
    expect(result.code).toContain(`intl.t('take', undefined, "f.tsx")`);
  });

  it('handles nested calls and complex args', () => {
    const result = transformSource({
      code: `intl.t('count: {n}', { n: items.length })`,
      factoryNames: factories,
      fileId: 'f.tsx',
    });
    expect(result.code).toBe(
      `intl.t('count: {n}', { n: items.length }, "f.tsx")`,
    );
  });
});
