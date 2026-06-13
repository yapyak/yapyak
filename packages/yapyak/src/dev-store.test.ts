import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  bind,
  getDevVersion,
  patch,
  purgeFile,
  resetDevStore,
  subscribeDev,
} from './dev-store';

afterEach(() => {
  resetDevStore();
});

describe('bind', () => {
  it('returns the initial catalog when no entry exists', () => {
    const catalog = bind('src/Header.tsx', 'Save', {
      en: 'Save',
      sv: 'Spara',
    });

    expect(catalog).toEqual({
      en: 'Save',
      sv: 'Spara',
    });
  });

  it('preserves catalog identity across repeat binds', () => {
    const first = bind('src/Header.tsx', 'Save', {
      en: 'Save',
      sv: 'Spara',
    });
    const second = bind('src/Header.tsx', 'Save', {
      en: 'Save',
      sv: 'Spara',
    });

    expect(second).toBe(first);
  });

  it('preserves prior patches when a repeat bind runs', () => {
    bind('src/Header.tsx', 'Save', {
      en: 'Save',
      sv: 'Spara',
    });
    patch('src/Header.tsx', 'Save', 'sv', 'Spara nu');
    const rebound = bind('src/Header.tsx', 'Save', {
      en: 'Save',
      sv: 'Spara',
    });

    expect(rebound.sv).toBe('Spara nu');
  });

  it('applies buffered patches that arrived before bind', () => {
    patch('src/Header.tsx', 'Save', 'sv', 'Spara nu');
    const catalog = bind('src/Header.tsx', 'Save', {
      en: 'Save',
      sv: 'Spara',
    });

    expect(catalog.sv).toBe('Spara nu');
  });

  it('isolates catalogs across different sources in the same file', () => {
    const save = bind('src/Header.tsx', 'Save', {
      en: 'Save',
    });
    const cancel = bind('src/Header.tsx', 'Cancel', {
      en: 'Cancel',
    });

    expect(save).not.toBe(cancel);
  });

  it('isolates catalogs across different file ids', () => {
    const headerSave = bind('src/Header.tsx', 'Save', {
      en: 'Save',
    });
    const footerSave = bind('src/Footer.tsx', 'Save', {
      en: 'Save',
    });

    expect(headerSave).not.toBe(footerSave);
  });
});

describe('patch', () => {
  it('writes a locale value into a bound catalog in place', () => {
    const catalog = bind('src/Header.tsx', 'Save', {
      en: 'Save',
      sv: 'Spara',
    });

    patch('src/Header.tsx', 'Save', 'sv', 'Spara nu');

    expect(catalog.sv).toBe('Spara nu');
  });

  it('preserves catalog identity when patching', () => {
    const catalog = bind('src/Header.tsx', 'Save', {
      en: 'Save',
    });

    patch('src/Header.tsx', 'Save', 'sv', 'Spara');

    expect(catalog).toBe(
      bind('src/Header.tsx', 'Save', {
        en: 'Save',
      }),
    );
  });

  it('clears the locale key when patched with an empty string', () => {
    const catalog = bind('src/Header.tsx', 'Save', {
      en: 'Save',
      sv: 'Spara',
    });

    patch('src/Header.tsx', 'Save', 'sv', '');

    expect(Object.hasOwn(catalog, 'sv')).toBe(false);
    expect(catalog.en).toBe('Save');
  });

  it('refuses to write an empty buffered patch into a later bind', () => {
    patch('src/Lazy.tsx', 'Loading...', 'sv', '');
    const catalog = bind('src/Lazy.tsx', 'Loading...', {
      en: 'Loading...',
      sv: 'Laddar...',
    });

    expect(Object.hasOwn(catalog, 'sv')).toBe(false);
  });

  it('writes a Template value into a bound catalog', () => {
    const catalog = bind('src/Header.tsx', 'Hi {name}', {
      en: 'Hi {name}',
    });
    const template = [
      'Hej ',
      {
        kind: 'placeholder' as const,
        name: 'name',
      },
    ];

    patch('src/Header.tsx', 'Hi {name}', 'sv', template as never);

    expect(catalog.sv).toBe(template);
  });

  it('buffers a patch when no catalog is bound', () => {
    patch('src/Lazy.tsx', 'Loading...', 'sv', 'Laddar...');
    const catalog = bind('src/Lazy.tsx', 'Loading...', {
      en: 'Loading...',
    });

    expect(catalog.sv).toBe('Laddar...');
  });

  it('folds repeat buffered patches for the same locale to the latest value', () => {
    patch('src/Lazy.tsx', 'Loading...', 'sv', 'Stale');
    patch('src/Lazy.tsx', 'Loading...', 'sv', 'Laddar...');
    const catalog = bind('src/Lazy.tsx', 'Loading...', {
      en: 'Loading...',
    });

    expect(catalog.sv).toBe('Laddar...');
  });

  it('preserves distinct buffered locales for the same source', () => {
    patch('src/Lazy.tsx', 'Loading...', 'sv', 'Laddar...');
    patch('src/Lazy.tsx', 'Loading...', 'de', 'Lädt...');
    const catalog = bind('src/Lazy.tsx', 'Loading...', {
      en: 'Loading...',
    });

    expect(catalog.sv).toBe('Laddar...');
    expect(catalog.de).toBe('Lädt...');
  });

  it('notifies subscribers when patching a bound catalog', () => {
    bind('src/Header.tsx', 'Save', {
      en: 'Save',
    });
    const subscriber = vi.fn();
    subscribeDev(subscriber);

    patch('src/Header.tsx', 'Save', 'sv', 'Spara');

    expect(subscriber).toHaveBeenCalledOnce();
  });

  it('notifies subscribers when buffering an unbound patch', () => {
    const subscriber = vi.fn();
    subscribeDev(subscriber);

    patch('src/Lazy.tsx', 'Loading...', 'sv', 'Laddar...');

    expect(subscriber).toHaveBeenCalledOnce();
  });
});

describe('purgeFile', () => {
  it('clears every catalog for the file id', () => {
    bind('src/Header.tsx', 'Save', {
      en: 'Save',
    });
    bind('src/Header.tsx', 'Cancel', {
      en: 'Cancel',
    });

    purgeFile('src/Header.tsx');

    const reboundSave = bind('src/Header.tsx', 'Save', {
      en: 'Save fresh',
    });
    expect(reboundSave).toEqual({
      en: 'Save fresh',
    });
  });

  it('preserves catalogs for other file ids', () => {
    const footerSave = bind('src/Footer.tsx', 'Save', {
      en: 'Save',
    });
    bind('src/Header.tsx', 'Save', {
      en: 'Save',
    });

    purgeFile('src/Header.tsx');

    expect(
      bind('src/Footer.tsx', 'Save', {
        en: 'ignored',
      }),
    ).toBe(footerSave);
  });

  it('clears buffered patches for the file id', () => {
    patch('src/Lazy.tsx', 'Loading...', 'sv', 'Laddar...');

    purgeFile('src/Lazy.tsx');

    const catalog = bind('src/Lazy.tsx', 'Loading...', {
      en: 'Loading...',
    });
    expect(catalog).toEqual({
      en: 'Loading...',
    });
  });

  it('notifies subscribers when entries are purged', () => {
    bind('src/Header.tsx', 'Save', {
      en: 'Save',
    });
    const subscriber = vi.fn();
    subscribeDev(subscriber);

    purgeFile('src/Header.tsx');

    expect(subscriber).toHaveBeenCalledOnce();
  });

  it('refuses to notify when nothing matches the file id', () => {
    bind('src/Header.tsx', 'Save', {
      en: 'Save',
    });
    const subscriber = vi.fn();
    subscribeDev(subscriber);

    purgeFile('src/Unknown.tsx');

    expect(subscriber).not.toHaveBeenCalled();
  });
});

describe('subscribeDev', () => {
  it('returns an unsubscribe handle', () => {
    const unsubscribe = subscribeDev(() => {});

    expect(unsubscribe).toBeTypeOf('function');
  });

  it('notifies every subscriber when a patch fires', () => {
    const first = vi.fn();
    const second = vi.fn();
    subscribeDev(first);
    subscribeDev(second);

    patch('src/Header.tsx', 'Save', 'sv', 'Spara');

    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it('clears the subscriber after unsubscribe runs', () => {
    const subscriber = vi.fn();
    const unsubscribe = subscribeDev(subscriber);

    unsubscribe();
    patch('src/Header.tsx', 'Save', 'sv', 'Spara');

    expect(subscriber).not.toHaveBeenCalled();
  });
});

describe('getDevVersion', () => {
  it('returns 0 at startup', () => {
    expect(getDevVersion()).toBe(0);
  });

  it('increments when a patch fires', () => {
    const before = getDevVersion();

    patch('src/Header.tsx', 'Save', 'sv', 'Spara');

    expect(getDevVersion()).toBe(before + 1);
  });

  it('increments when a purge fires for a known file id', () => {
    bind('src/Header.tsx', 'Save', {
      en: 'Save',
    });
    const before = getDevVersion();

    purgeFile('src/Header.tsx');

    expect(getDevVersion()).toBe(before + 1);
  });
});
