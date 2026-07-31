import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createLocaleResolver } from './locale-resolver';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('createLocaleResolver', () => {
  let projectRoot: string;
  let localePath: string;

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), 'yapyak-locale-resolver-'));
    mkdirSync(join(projectRoot, 'locales'), {
      recursive: true,
    });
    localePath = join(projectRoot, 'locales', 'sv.json');
    writeFileSync(
      localePath,
      JSON.stringify({
        'src/a.tsx': {
          Hello: 'Hej',
        },
      }),
    );
  });

  afterEach(() => {
    rmSync(projectRoot, {
      force: true,
      recursive: true,
    });
  });

  describe('with defaults', () => {
    it('lists the discovered locales', () => {
      const resolver = createLocaleResolver(
        {
          defaultLocale: 'en',
          localesDir: 'locales',
        },
        projectRoot,
      );

      expect(resolver.getDiscovery()).toEqual({
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        warnings: [],
      });
    });

    it('returns the project locales as the emitted locales', () => {
      const resolver = createLocaleResolver(
        {
          defaultLocale: 'en',
          localesDir: 'locales',
        },
        projectRoot,
      );

      expect(resolver.getEmittedLocales()).toEqual({
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
      });
    });

    it('reads the locale data for every emitted locale', () => {
      const resolver = createLocaleResolver(
        {
          defaultLocale: 'en',
          localesDir: 'locales',
        },
        projectRoot,
      );

      expect(resolver.getLocaleData()).toEqual({
        en: {},
        sv: {
          'src/a.tsx': {
            Hello: 'Hej',
          },
        },
      });
    });

    it('preserves the cached locale data when the file changes', () => {
      const resolver = createLocaleResolver(
        {
          defaultLocale: 'en',
          localesDir: 'locales',
        },
        projectRoot,
      );
      const before = resolver.getLocaleData();
      writeFileSync(
        localePath,
        JSON.stringify({
          'src/a.tsx': {
            Hello: 'Hej',
            World: 'Världen',
          },
        }),
      );

      expect(resolver.getLocaleData()).toEqual(before);
    });

    it('invalidates the cached locale data', () => {
      const resolver = createLocaleResolver(
        {
          defaultLocale: 'en',
          localesDir: 'locales',
        },
        projectRoot,
      );
      resolver.getLocaleData();
      writeFileSync(
        localePath,
        JSON.stringify({
          'src/a.tsx': {
            Hello: 'Hej',
            World: 'Världen',
          },
        }),
      );
      resolver.invalidateData();

      expect(resolver.getLocaleData()).toEqual({
        en: {},
        sv: {
          'src/a.tsx': {
            Hello: 'Hej',
            World: 'Världen',
          },
        },
      });
    });

    it('preserves the discovery when only the data is invalidated', () => {
      const resolver = createLocaleResolver(
        {
          defaultLocale: 'en',
          localesDir: 'locales',
        },
        projectRoot,
      );
      resolver.getDiscovery();
      writeFileSync(join(projectRoot, 'locales', 'de.json'), '{}');
      resolver.invalidateData();

      expect(resolver.getDiscovery().locales).toEqual([
        'en',
        'sv',
      ]);
    });

    it('invalidates every cached layer on a structure invalidation', () => {
      const resolver = createLocaleResolver(
        {
          defaultLocale: 'en',
          localesDir: 'locales',
        },
        projectRoot,
      );
      resolver.getDiscovery();
      resolver.getLocaleData();
      writeFileSync(
        join(projectRoot, 'locales', 'de.json'),
        JSON.stringify({
          'src/a.tsx': {
            Hello: 'Hallo',
          },
        }),
      );
      resolver.invalidateStructure();

      expect(resolver.getDiscovery().locales).toEqual([
        'de',
        'en',
        'sv',
      ]);
      expect(resolver.getLocaleData().de).toEqual({
        'src/a.tsx': {
          Hello: 'Hallo',
        },
      });
    });
  });

  describe('with overrides', () => {
    it('overrides the emitted locales with the fixed locale', () => {
      const resolver = createLocaleResolver(
        {
          defaultLocale: 'en',
          localesDir: 'locales',
        },
        projectRoot,
        {
          fixedLocale: 'sv',
        },
      );

      expect(resolver.getEmittedLocales()).toEqual({
        defaultLocale: 'sv',
        locales: [
          'sv',
        ],
      });
    });

    it('preserves the project locales when a fixed locale is set', () => {
      const resolver = createLocaleResolver(
        {
          defaultLocale: 'en',
          localesDir: 'locales',
        },
        projectRoot,
        {
          fixedLocale: 'sv',
        },
      );

      expect(resolver.getProjectLocales()).toEqual({
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
      });
    });

    it('reads the locale data for the fixed locale', () => {
      const resolver = createLocaleResolver(
        {
          defaultLocale: 'en',
          localesDir: 'locales',
        },
        projectRoot,
        {
          fixedLocale: 'sv',
        },
      );

      expect(resolver.getLocaleData()).toEqual({
        sv: {
          'src/a.tsx': {
            Hello: 'Hej',
          },
        },
      });
    });
  });
});
