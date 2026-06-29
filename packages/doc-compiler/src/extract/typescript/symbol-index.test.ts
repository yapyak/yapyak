import type { SymbolIndexEntry } from './symbol-index';

import { describe, expect, it } from 'vitest';

import { buildSymbolIndex, resolveSymbolLink } from './symbol-index';

function entry(overrides: Partial<SymbolIndexEntry> = {}): SymbolIndexEntry {
  return {
    callable: false,
    callableMemberNames: new Set(),
    href: '/reference/yapyak/createTranslator',
    hrefsByMemberName: new Map(),
    moduleId: 'yapyak/translator',
    name: 'createTranslator',
    packageSlug: 'yapyak',
    ...overrides,
  };
}

describe('buildSymbolIndex', () => {
  it('builds bare and module-qualified entries from `SymbolIndexEntry[]`', () => {
    const result = buildSymbolIndex([
      entry(),
    ]);

    const bare = result.get('createTranslator');
    expect(bare?.moduleId).toBe('yapyak/translator');
    expect(bare?.href).toBe('/reference/yapyak/createTranslator');

    const qualified = result.get('yapyak/translator::createTranslator');
    expect(qualified?.moduleId).toBe('yapyak/translator');
    expect(qualified?.href).toBe('/reference/yapyak/createTranslator');
  });

  it('preserves the first symbol when two share a bare name', () => {
    const result = buildSymbolIndex([
      entry({
        href: '/reference/yapyak/createTranslator',
        moduleId: 'yapyak/translator',
      }),
      entry({
        href: '/reference/yapyak/processor/createTranslator',
        moduleId: 'yapyak/processor',
      }),
    ]);

    expect(result.get('createTranslator')?.moduleId).toBe('yapyak/translator');
    expect(result.get('yapyak/processor::createTranslator')?.href).toBe(
      '/reference/yapyak/processor/createTranslator',
    );
  });

  it('returns an empty index for an empty input', () => {
    expect(buildSymbolIndex([]).size).toBe(0);
  });
});

describe('resolveSymbolLink', () => {
  it('resolves a bare name to its entry', () => {
    const index = buildSymbolIndex([
      entry(),
    ]);

    const resolved = resolveSymbolLink(index, 'createTranslator');
    expect(resolved?.href).toBe('/reference/yapyak/createTranslator');
    expect(resolved?.name).toBe('createTranslator');
  });

  it('resolves an `X.member` path to the member href', () => {
    const index = buildSymbolIndex([
      entry({
        callable: false,
        callableMemberNames: new Set(),
        hrefsByMemberName: new Map([
          [
            'translate',
            '/reference/yapyak/createTranslator.translate',
          ],
        ]),
      }),
    ]);

    const resolved = resolveSymbolLink(index, 'createTranslator.translate');
    expect(resolved?.href).toBe('/reference/yapyak/createTranslator.translate');
    expect(resolved?.name).toBe('createTranslator.translate');
  });

  it('resolves an `X#member` path to the member href', () => {
    const index = buildSymbolIndex([
      entry({
        callable: false,
        callableMemberNames: new Set(),
        hrefsByMemberName: new Map([
          [
            'translate',
            '/reference/yapyak/createTranslator.translate',
          ],
        ]),
      }),
    ]);

    const resolved = resolveSymbolLink(index, 'createTranslator#translate');
    expect(resolved?.href).toBe('/reference/yapyak/createTranslator.translate');
    expect(resolved?.name).toBe('createTranslator.translate');
  });

  it('returns `undefined` for an unknown bare reference', () => {
    const index = buildSymbolIndex([
      entry(),
    ]);

    expect(resolveSymbolLink(index, 'unknownThing')).toBeUndefined();
  });

  it('returns `undefined` when the base resolves but the member does not', () => {
    const index = buildSymbolIndex([
      entry({
        callable: false,
        callableMemberNames: new Set(),
        hrefsByMemberName: new Map([
          [
            'translate',
            '/reference/yapyak/createTranslator.translate',
          ],
        ]),
      }),
    ]);

    expect(
      resolveSymbolLink(index, 'createTranslator.missingMember'),
    ).toBeUndefined();
  });
});
