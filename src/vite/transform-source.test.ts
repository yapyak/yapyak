import { describe, expect, it } from 'vitest';
import { messageHash } from './message-hash';
import { DynamicSourceError } from './parse-source-arg';
import { transformSource } from './transform-source';

const factories = new Set(['intl']);

describe('transformSource', () => {
  it('replaces single-arg t() with hash function call', () => {
    const fileId = 'src/header.tsx';
    const hash = messageHash(fileId, 'Welcome!');
    const result = transformSource({
      code: `intl.t('Welcome!')`,
      factoryNames: factories,
      fileId,
    });
    expect(result.code).toBe(
      `import { _m_${hash} } from 'yapyak/messages';\n_m_${hash}()`,
    );
    expect(result.count).toBe(1);
    expect(result.messages).toEqual([
      { fileId, hash, source: 'Welcome!' },
    ]);
  });

  it('replaces two-arg t() with hash function call passing params', () => {
    const fileId = 'src/header.tsx';
    const hash = messageHash(fileId, 'Hello, {name}!');
    const result = transformSource({
      code: `intl.t('Hello, {name}!', { name: 'X' })`,
      factoryNames: factories,
      fileId,
    });
    expect(result.code).toBe(
      `import { _m_${hash} } from 'yapyak/messages';\n_m_${hash}({ name: 'X' })`,
    );
  });

  it('handles multiple t() calls in same file with one import', () => {
    const fileId = 'f.tsx';
    const hashA = messageHash(fileId, 'A');
    const hashB = messageHash(fileId, 'B');
    const result = transformSource({
      code: `intl.t('A'); intl.t('B', { x: 1 });`,
      factoryNames: factories,
      fileId,
    });
    expect(result.count).toBe(2);
    expect(result.messages).toHaveLength(2);
    expect(result.code).toContain(
      `import { _m_${hashA}, _m_${hashB} } from 'yapyak/messages';`,
    );
    expect(result.code).toContain(`_m_${hashA}()`);
    expect(result.code).toContain(`_m_${hashB}({ x: 1 })`);
  });

  it('ignores non-factory namespaces', () => {
    const fileId = 'f.tsx';
    const hash = messageHash(fileId, 'take');
    const result = transformSource({
      code: `other.t('skip'); intl.t('take')`,
      factoryNames: factories,
      fileId,
    });
    expect(result.count).toBe(1);
    expect(result.code).toContain(`other.t('skip')`);
    expect(result.code).toContain(`_m_${hash}()`);
  });

  it('deduplicates identical messages within a file', () => {
    const fileId = 'f.tsx';
    const hash = messageHash(fileId, 'Hi');
    const result = transformSource({
      code: `intl.t('Hi'); intl.t('Hi');`,
      factoryNames: factories,
      fileId,
    });
    expect(result.count).toBe(2);
    expect(result.messages).toHaveLength(1);
    expect(result.code).toContain(
      `import { _m_${hash} } from 'yapyak/messages';`,
    );
  });

  it('throws DynamicSourceError on variable source', () => {
    expect(() =>
      transformSource({
        code: `intl.t(message)`,
        factoryNames: factories,
        fileId: 'f.tsx',
      }),
    ).toThrow(DynamicSourceError);
  });

  it('throws DynamicSourceError on template interpolation', () => {
    expect(() =>
      transformSource({
        code: 'intl.t(`Hello ${name}`)',
        factoryNames: factories,
        fileId: 'f.tsx',
      }),
    ).toThrow(DynamicSourceError);
  });

  it('accepts plain backtick template without interpolation', () => {
    const fileId = 'f.tsx';
    const hash = messageHash(fileId, 'plain');
    const result = transformSource({
      code: 'intl.t(`plain`)',
      factoryNames: factories,
      fileId,
    });
    expect(result.code).toContain(`_m_${hash}()`);
  });
});
