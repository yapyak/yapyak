import type { Template } from './template/internal';

import { afterEach, describe, expect, it } from 'vitest';

import { registerVariants, resetDevStore } from './dev-store';
import { applyPatches } from './hmr-patch';

describe('applyPatches', () => {
  afterEach(() => {
    resetDevStore();
  });

  it('writes a single patch into the registered catalog entry', () => {
    const variants = registerVariants('file.ts', 'msg1', {
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
    expect(variants).toEqual({
      en: 'Hello',
      sv: 'Hej',
    });
  });

  it('writes multiple patches across catalogs in one call', () => {
    const a = registerVariants('a.ts', 'm1', {
      en: 'A',
    });
    const b = registerVariants('b.ts', 'm2', {
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
    const variants = registerVariants('late.ts', 'msg', {
      en: 'Hello',
    });
    expect(variants).toEqual({
      en: 'Hello',
      sv: 'Hej',
    });
  });

  it('clears a locale when its patched value is an empty string', () => {
    const variants = registerVariants('file.ts', 'msg', {
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
    expect(variants).toEqual({
      en: 'Hello',
    });
  });

  it('writes a template-array patch verbatim into the catalog entry', () => {
    const template: Template = [
      {
        kind: 'literal',
        value: 'Hi ',
      },
      {
        kind: 'placeholder',
        name: 'name',
      },
    ];
    const variants = registerVariants('file.ts', 'msg', {});
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
    expect(variants).toEqual({
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
