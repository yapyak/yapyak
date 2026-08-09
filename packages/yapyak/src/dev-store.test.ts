import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  autoSubscribeDev,
  getDevVersion,
  invalidateFile,
  registerVariants,
  resetDevStore,
  setVariant,
  subscribeDev,
} from './dev-store';

function makeMeta(
  hot?:
    | {
        dispose(callback: () => void): void;
      }
    | undefined,
): ImportMeta {
  return {
    ...import.meta,
    hot,
  };
}

afterEach(() => {
  resetDevStore();
});

describe('registerVariants', () => {
  it('returns the initial catalog when no entry exists', () => {
    const variants = registerVariants('src/a.tsx', 'Save', {
      en: 'Save',
      sv: 'Spara',
    });

    expect(variants).toEqual({
      en: 'Save',
      sv: 'Spara',
    });
  });

  it('returns the bound catalog on a repeat call', () => {
    const first = registerVariants('src/a.tsx', 'Save', {
      en: 'Save',
      sv: 'Spara',
    });
    const second = registerVariants('src/a.tsx', 'Save', {
      en: 'Save',
      sv: 'Spara',
    });

    expect(second).toBe(first);
  });

  it('preserves prior entries when a repeat call runs', () => {
    registerVariants('src/a.tsx', 'Save', {
      en: 'Save',
      sv: 'Spara',
    });
    setVariant('src/a.tsx', 'Save', 'sv', 'Spara ändringar');
    const rebound = registerVariants('src/a.tsx', 'Save', {
      en: 'Save',
      sv: 'Spara',
    });

    expect(rebound.sv).toBe('Spara ändringar');
  });

  it('folds a buffered entry into a later registerVariants', () => {
    setVariant('src/a.tsx', 'Save', 'sv', 'Spara');
    const variants = registerVariants('src/a.tsx', 'Save', {
      en: 'Save',
    });

    expect(variants.sv).toBe('Spara');
  });

  it('holds distinct catalogs for distinct ids within one file', () => {
    const save = registerVariants('src/a.tsx', 'Save', {
      en: 'Save',
    });
    const cancel = registerVariants('src/a.tsx', 'Cancel', {
      en: 'Cancel',
    });

    expect(save).not.toBe(cancel);
  });

  it('holds distinct catalogs for distinct file ids', () => {
    const fromA = registerVariants('src/a.tsx', 'Save', {
      en: 'Save',
    });
    const fromB = registerVariants('src/b.tsx', 'Save', {
      en: 'Save',
    });

    expect(fromA).not.toBe(fromB);
  });
});

describe('setVariant', () => {
  it('writes a locale value into a bound catalog in place', () => {
    const variants = registerVariants('src/a.tsx', 'Save', {
      en: 'Save',
      sv: 'Spara',
    });

    setVariant('src/a.tsx', 'Save', 'sv', 'Spara ändringar');

    expect(variants.sv).toBe('Spara ändringar');
  });

  it('preserves catalog identity when writing an entry', () => {
    const variants = registerVariants('src/a.tsx', 'Save', {
      en: 'Save',
    });

    setVariant('src/a.tsx', 'Save', 'sv', 'Spara');

    expect(variants).toBe(
      registerVariants('src/a.tsx', 'Save', {
        en: 'Save',
      }),
    );
  });

  it('clears the locale key when the value is empty', () => {
    const variants = registerVariants('src/a.tsx', 'Save', {
      en: 'Save',
      sv: 'Spara',
    });

    setVariant('src/a.tsx', 'Save', 'sv', '');

    expect(Object.hasOwn(variants, 'sv')).toBe(false);
    expect(variants.en).toBe('Save');
  });

  it('refuses to write an empty buffered entry into a later registerVariants', () => {
    setVariant('src/a.tsx', 'Save', 'sv', '');
    const variants = registerVariants('src/a.tsx', 'Save', {
      en: 'Save',
      sv: 'Spara',
    });

    expect(Object.hasOwn(variants, 'sv')).toBe(false);
  });

  it('writes a `Template` value into a bound catalog', () => {
    const variants = registerVariants('src/a.tsx', 'Hi {name}', {
      en: 'Hi {name}',
    });
    const template = [
      'Hej ',
      {
        kind: 'placeholder' as const,
        name: 'name',
      },
    ];

    setVariant('src/a.tsx', 'Hi {name}', 'sv', template as never);

    expect(variants.sv).toBe(template);
  });

  it('holds a buffered entry when no catalog is bound', () => {
    setVariant('src/a.tsx', 'Loading...', 'sv', 'Laddar...');
    const variants = registerVariants('src/a.tsx', 'Loading...', {
      en: 'Loading...',
    });

    expect(variants.sv).toBe('Laddar...');
  });

  it('folds repeat buffered entries for one locale to the latest value', () => {
    setVariant('src/a.tsx', 'Loading...', 'sv', 'Spara');
    setVariant('src/a.tsx', 'Loading...', 'sv', 'Laddar...');
    const variants = registerVariants('src/a.tsx', 'Loading...', {
      en: 'Loading...',
    });

    expect(variants.sv).toBe('Laddar...');
  });

  it('preserves distinct buffered locales for one id', () => {
    setVariant('src/a.tsx', 'Cancel', 'sv', 'Avbryt');
    setVariant('src/a.tsx', 'Cancel', 'fi', 'Peruuta');
    const variants = registerVariants('src/a.tsx', 'Cancel', {
      en: 'Cancel',
    });

    expect(variants.sv).toBe('Avbryt');
    expect(variants.fi).toBe('Peruuta');
  });

  it('notifies subscribers when writing to a bound catalog', () => {
    registerVariants('src/a.tsx', 'Save', {
      en: 'Save',
    });
    const subscriber = vi.fn();
    subscribeDev(subscriber);

    setVariant('src/a.tsx', 'Save', 'sv', 'Spara');

    expect(subscriber).toHaveBeenCalledOnce();
  });

  it('notifies subscribers when holding an unbound entry', () => {
    const subscriber = vi.fn();
    subscribeDev(subscriber);

    setVariant('src/a.tsx', 'Loading...', 'sv', 'Laddar...');

    expect(subscriber).toHaveBeenCalledOnce();
  });
});

describe('invalidateFile', () => {
  it('clears every catalog for the file id', () => {
    registerVariants('src/a.tsx', 'Save', {
      en: 'Save',
    });
    registerVariants('src/a.tsx', 'Cancel', {
      en: 'Cancel',
    });

    invalidateFile('src/a.tsx');

    const rebound = registerVariants('src/a.tsx', 'Save', {
      en: 'Hello',
    });
    expect(rebound).toEqual({
      en: 'Hello',
    });
  });

  it('preserves catalogs for other file ids', () => {
    const fromB = registerVariants('src/b.tsx', 'Save', {
      en: 'Save',
    });
    registerVariants('src/a.tsx', 'Save', {
      en: 'Save',
    });

    invalidateFile('src/a.tsx');

    expect(
      registerVariants('src/b.tsx', 'Save', {
        en: 'World',
      }),
    ).toBe(fromB);
  });

  it('clears buffered entries for the file id', () => {
    setVariant('src/a.tsx', 'Loading...', 'sv', 'Laddar...');

    invalidateFile('src/a.tsx');

    const variants = registerVariants('src/a.tsx', 'Loading...', {
      en: 'Loading...',
    });
    expect(variants).toEqual({
      en: 'Loading...',
    });
  });

  it('notifies subscribers when entries are cleared', () => {
    registerVariants('src/a.tsx', 'Save', {
      en: 'Save',
    });
    const subscriber = vi.fn();
    subscribeDev(subscriber);

    invalidateFile('src/a.tsx');

    expect(subscriber).toHaveBeenCalledOnce();
  });

  it('refuses to notify when no catalog matches the file id', () => {
    registerVariants('src/a.tsx', 'Save', {
      en: 'Save',
    });
    const subscriber = vi.fn();
    subscribeDev(subscriber);

    invalidateFile('src/b.tsx');

    expect(subscriber).not.toHaveBeenCalled();
  });
});

describe('autoSubscribeDev', () => {
  it('notifies the subscriber when an entry fires', () => {
    const subscriber = vi.fn();
    autoSubscribeDev(makeMeta(), subscriber);

    setVariant('src/a.tsx', 'Save', 'sv', 'Spara');

    expect(subscriber).toHaveBeenCalledOnce();
  });

  it('notifies meta.hot.dispose with an unsubscribe handle', () => {
    const dispose = vi.fn();
    const subscriber = vi.fn();

    autoSubscribeDev(
      makeMeta({
        dispose,
      }),
      subscriber,
    );

    expect(dispose).toHaveBeenCalledOnce();
    const unsubscribe = dispose.mock.calls[0]?.[0];
    expect(unsubscribe).toBeTypeOf('function');
    unsubscribe?.();
    setVariant('src/a.tsx', 'Save', 'sv', 'Spara');
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

    setVariant('src/a.tsx', 'Save', 'sv', 'Spara');

    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it('clears the subscriber after unsubscribe runs', () => {
    const subscriber = vi.fn();
    const unsubscribe = subscribeDev(subscriber);

    unsubscribe();
    setVariant('src/a.tsx', 'Save', 'sv', 'Spara');

    expect(subscriber).not.toHaveBeenCalled();
  });
});

describe('getDevVersion', () => {
  it('returns 0 at startup', () => {
    expect(getDevVersion()).toBe(0);
  });

  it('yields a new version when an entry fires', () => {
    const before = getDevVersion();

    setVariant('src/a.tsx', 'Save', 'sv', 'Spara');

    expect(getDevVersion()).toBe(before + 1);
  });

  it('yields a new version when invalidation fires for a known file id', () => {
    registerVariants('src/a.tsx', 'Save', {
      en: 'Save',
    });
    const before = getDevVersion();

    invalidateFile('src/a.tsx');

    expect(getDevVersion()).toBe(before + 1);
  });
});
