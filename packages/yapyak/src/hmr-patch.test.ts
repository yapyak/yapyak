import { afterEach, describe, expect, it } from 'vitest';

import { registerCatalog, resetDevStore } from './dev-store';
import { applyPatches } from './hmr-patch';

describe('applyPatches', () => {
  afterEach(() => {
    resetDevStore();
  });

  it('writes a single patch into the registered catalog entry', () => {
    const catalog = registerCatalog('file.ts', 'msg1', {
      en: 'Hello',
    });
    applyPatches({
      patches: [
        {
          fileId: 'file.ts',
          id: 'msg1',
          locale: 'sv',
          value: 'Hej',
        },
      ],
    });
    expect(catalog).toEqual({
      en: 'Hello',
      sv: 'Hej',
    });
  });

  it('writes multiple patches across catalogs in one call', () => {
    const a = registerCatalog('a.ts', 'm1', {
      en: 'A',
    });
    const b = registerCatalog('b.ts', 'm2', {
      en: 'B',
    });
    applyPatches({
      patches: [
        {
          fileId: 'a.ts',
          id: 'm1',
          locale: 'sv',
          value: 'aA',
        },
        {
          fileId: 'b.ts',
          id: 'm2',
          locale: 'sv',
          value: 'bB',
        },
      ],
    });
    expect(a).toEqual({
      en: 'A',
      sv: 'aA',
    });
    expect(b).toEqual({
      en: 'B',
      sv: 'bB',
    });
  });

  it('queues a patch as pending when its catalog is not yet registered, then applies on register', () => {
    applyPatches({
      patches: [
        {
          fileId: 'late.ts',
          id: 'msg',
          locale: 'sv',
          value: 'Hej',
        },
      ],
    });
    const catalog = registerCatalog('late.ts', 'msg', {
      en: 'Hello',
    });
    expect(catalog).toEqual({
      en: 'Hello',
      sv: 'Hej',
    });
  });

  it('clears a locale when its patched value is an empty string', () => {
    const catalog = registerCatalog('file.ts', 'msg', {
      en: 'Hello',
      sv: 'Hej',
    });
    applyPatches({
      patches: [
        {
          fileId: 'file.ts',
          id: 'msg',
          locale: 'sv',
          value: '',
        },
      ],
    });
    expect(catalog).toEqual({
      en: 'Hello',
    });
  });

  it('writes a template-array patch verbatim into the catalog entry', () => {
    const template = [
      'Hello, ',
      {
        kind: 'placeholder',
        name: 'name',
      },
    ];
    const catalog = registerCatalog('file.ts', 'msg', {});
    applyPatches({
      patches: [
        {
          fileId: 'file.ts',
          id: 'msg',
          locale: 'sv',
          value: template,
        },
      ],
    });
    expect(catalog).toEqual({
      sv: template,
    });
  });

  it('preserves state when the patches array is empty', () => {
    expect(() =>
      applyPatches({
        patches: [],
      }),
    ).not.toThrow();
  });
});
