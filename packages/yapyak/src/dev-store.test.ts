import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getDevVersion,
  invalidateFile,
  registerCatalog,
  resetDevStore,
  setCatalogEntry,
  subscribeDev,
} from './dev-store';

afterEach(() => {
  resetDevStore();
});

describe('registerCatalog', () => {
  it('returns the initial catalog when no entry exists', () => {
    const catalog = registerCatalog('src/a.tsx', 'Save', {
      en: 'Save',
      sv: 'Spara',
    });

    expect(catalog).toEqual({
      en: 'Save',
      sv: 'Spara',
    });
  });

  it('returns the bound catalog on a repeat call', () => {
    const first = registerCatalog('src/a.tsx', 'Save', {
      en: 'Save',
      sv: 'Spara',
    });
    const second = registerCatalog('src/a.tsx', 'Save', {
      en: 'Save',
      sv: 'Spara',
    });

    expect(second).toBe(first);
  });

  it('preserves prior entries when a repeat call runs', () => {
    registerCatalog('src/a.tsx', 'Save', {
      en: 'Save',
      sv: 'Spara',
    });
    setCatalogEntry('src/a.tsx', 'Save', 'sv', 'Spara ändringar');
    const rebound = registerCatalog('src/a.tsx', 'Save', {
      en: 'Save',
      sv: 'Spara',
    });

    expect(rebound.sv).toBe('Spara ändringar');
  });

  it('folds a buffered entry into a later registerCatalog', () => {
    setCatalogEntry('src/a.tsx', 'Save', 'sv', 'Spara');
    const catalog = registerCatalog('src/a.tsx', 'Save', {
      en: 'Save',
    });

    expect(catalog.sv).toBe('Spara');
  });

  it('holds distinct catalogs for distinct ids within one file', () => {
    const save = registerCatalog('src/a.tsx', 'Save', {
      en: 'Save',
    });
    const cancel = registerCatalog('src/a.tsx', 'Cancel', {
      en: 'Cancel',
    });

    expect(save).not.toBe(cancel);
  });

  it('holds distinct catalogs for distinct file ids', () => {
    const fromA = registerCatalog('src/a.tsx', 'Save', {
      en: 'Save',
    });
    const fromB = registerCatalog('src/b.tsx', 'Save', {
      en: 'Save',
    });

    expect(fromA).not.toBe(fromB);
  });
});

describe('setCatalogEntry', () => {
  it('writes a locale value into a bound catalog in place', () => {
    const catalog = registerCatalog('src/a.tsx', 'Save', {
      en: 'Save',
      sv: 'Spara',
    });

    setCatalogEntry('src/a.tsx', 'Save', 'sv', 'Spara ändringar');

    expect(catalog.sv).toBe('Spara ändringar');
  });

  it('preserves catalog identity when writing an entry', () => {
    const catalog = registerCatalog('src/a.tsx', 'Save', {
      en: 'Save',
    });

    setCatalogEntry('src/a.tsx', 'Save', 'sv', 'Spara');

    expect(catalog).toBe(
      registerCatalog('src/a.tsx', 'Save', {
        en: 'Save',
      }),
    );
  });

  it('clears the locale key when the value is empty', () => {
    const catalog = registerCatalog('src/a.tsx', 'Save', {
      en: 'Save',
      sv: 'Spara',
    });

    setCatalogEntry('src/a.tsx', 'Save', 'sv', '');

    expect(Object.hasOwn(catalog, 'sv')).toBe(false);
    expect(catalog.en).toBe('Save');
  });

  it('refuses to write an empty buffered entry into a later registerCatalog', () => {
    setCatalogEntry('src/a.tsx', 'Save', 'sv', '');
    const catalog = registerCatalog('src/a.tsx', 'Save', {
      en: 'Save',
      sv: 'Spara',
    });

    expect(Object.hasOwn(catalog, 'sv')).toBe(false);
  });

  it('writes a `Template` value into a bound catalog', () => {
    const catalog = registerCatalog('src/a.tsx', 'Hi {name}', {
      en: 'Hi {name}',
    });
    const template = [
      'Hej ',
      {
        kind: 'placeholder' as const,
        name: 'name',
      },
    ];

    setCatalogEntry('src/a.tsx', 'Hi {name}', 'sv', template as never);

    expect(catalog.sv).toBe(template);
  });

  it('holds a buffered entry when no catalog is bound', () => {
    setCatalogEntry('src/a.tsx', 'Loading...', 'sv', 'Laddar...');
    const catalog = registerCatalog('src/a.tsx', 'Loading...', {
      en: 'Loading...',
    });

    expect(catalog.sv).toBe('Laddar...');
  });

  it('folds repeat buffered entries for one locale to the latest value', () => {
    setCatalogEntry('src/a.tsx', 'Loading...', 'sv', 'Spara');
    setCatalogEntry('src/a.tsx', 'Loading...', 'sv', 'Laddar...');
    const catalog = registerCatalog('src/a.tsx', 'Loading...', {
      en: 'Loading...',
    });

    expect(catalog.sv).toBe('Laddar...');
  });

  it('preserves distinct buffered locales for one id', () => {
    setCatalogEntry('src/a.tsx', 'Cancel', 'sv', 'Avbryt');
    setCatalogEntry('src/a.tsx', 'Cancel', 'fi', 'Peruuta');
    const catalog = registerCatalog('src/a.tsx', 'Cancel', {
      en: 'Cancel',
    });

    expect(catalog.sv).toBe('Avbryt');
    expect(catalog.fi).toBe('Peruuta');
  });

  it('notifies subscribers when writing to a bound catalog', () => {
    registerCatalog('src/a.tsx', 'Save', {
      en: 'Save',
    });
    const subscriber = vi.fn();
    subscribeDev(subscriber);

    setCatalogEntry('src/a.tsx', 'Save', 'sv', 'Spara');

    expect(subscriber).toHaveBeenCalledOnce();
  });

  it('notifies subscribers when holding an unbound entry', () => {
    const subscriber = vi.fn();
    subscribeDev(subscriber);

    setCatalogEntry('src/a.tsx', 'Loading...', 'sv', 'Laddar...');

    expect(subscriber).toHaveBeenCalledOnce();
  });
});

describe('invalidateFile', () => {
  it('clears every catalog for the file id', () => {
    registerCatalog('src/a.tsx', 'Save', {
      en: 'Save',
    });
    registerCatalog('src/a.tsx', 'Cancel', {
      en: 'Cancel',
    });

    invalidateFile('src/a.tsx');

    const rebound = registerCatalog('src/a.tsx', 'Save', {
      en: 'Hello',
    });
    expect(rebound).toEqual({
      en: 'Hello',
    });
  });

  it('preserves catalogs for other file ids', () => {
    const fromB = registerCatalog('src/b.tsx', 'Save', {
      en: 'Save',
    });
    registerCatalog('src/a.tsx', 'Save', {
      en: 'Save',
    });

    invalidateFile('src/a.tsx');

    expect(
      registerCatalog('src/b.tsx', 'Save', {
        en: 'World',
      }),
    ).toBe(fromB);
  });

  it('clears buffered entries for the file id', () => {
    setCatalogEntry('src/a.tsx', 'Loading...', 'sv', 'Laddar...');

    invalidateFile('src/a.tsx');

    const catalog = registerCatalog('src/a.tsx', 'Loading...', {
      en: 'Loading...',
    });
    expect(catalog).toEqual({
      en: 'Loading...',
    });
  });

  it('notifies subscribers when entries are cleared', () => {
    registerCatalog('src/a.tsx', 'Save', {
      en: 'Save',
    });
    const subscriber = vi.fn();
    subscribeDev(subscriber);

    invalidateFile('src/a.tsx');

    expect(subscriber).toHaveBeenCalledOnce();
  });

  it('refuses to notify when no catalog matches the file id', () => {
    registerCatalog('src/a.tsx', 'Save', {
      en: 'Save',
    });
    const subscriber = vi.fn();
    subscribeDev(subscriber);

    invalidateFile('src/b.tsx');

    expect(subscriber).not.toHaveBeenCalled();
  });
});

describe('subscribeDev', () => {
  it('returns an unsubscribe handle', () => {
    const unsubscribe = subscribeDev(() => {});

    expect(unsubscribe).toBeTypeOf('function');
  });

  it('notifies every subscriber when an entry fires', () => {
    const first = vi.fn();
    const second = vi.fn();
    subscribeDev(first);
    subscribeDev(second);

    setCatalogEntry('src/a.tsx', 'Save', 'sv', 'Spara');

    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it('clears the subscriber after unsubscribe runs', () => {
    const subscriber = vi.fn();
    const unsubscribe = subscribeDev(subscriber);

    unsubscribe();
    setCatalogEntry('src/a.tsx', 'Save', 'sv', 'Spara');

    expect(subscriber).not.toHaveBeenCalled();
  });
});

describe('getDevVersion', () => {
  it('returns 0 at startup', () => {
    expect(getDevVersion()).toBe(0);
  });

  it('yields a new version when an entry fires', () => {
    const before = getDevVersion();

    setCatalogEntry('src/a.tsx', 'Save', 'sv', 'Spara');

    expect(getDevVersion()).toBe(before + 1);
  });

  it('yields a new version when invalidation fires for a known file id', () => {
    registerCatalog('src/a.tsx', 'Save', {
      en: 'Save',
    });
    const before = getDevVersion();

    invalidateFile('src/a.tsx');

    expect(getDevVersion()).toBe(before + 1);
  });
});
