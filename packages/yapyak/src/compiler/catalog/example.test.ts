import type { LocaleData, OrphanCache } from './locale';

import { describe, expect, it } from 'vitest';

import { toMessageKey } from '../parser';
import { extractExamples } from './example';

const emptyOrphans: OrphanCache = {};

describe('extractExamples', () => {
  it('returns an empty list when max is 0', () => {
    const localeData: LocaleData = {
      sv: {
        'src/a.tsx': {
          Cancel: 'Avbryt',
          Save: 'Spara',
        },
      },
    };

    const examples = extractExamples({
      currentFileId: 'src/b.tsx',
      excludeKey: toMessageKey('Hello'),
      locale: 'sv',
      localeData,
      max: 0,
      orphans: emptyOrphans,
      source: 'Hello',
    });

    expect(examples).toEqual([]);
  });

  it('picks entries from the same locale across other files', () => {
    const localeData: LocaleData = {
      sv: {
        'src/a.tsx': {
          Cancel: 'Avbryt',
          Save: 'Spara',
        },
        'src/b.tsx': {
          Hello: 'Hej',
        },
      },
    };

    const examples = extractExamples({
      currentFileId: 'src/components/c.tsx',
      excludeKey: toMessageKey('World'),
      locale: 'sv',
      localeData,
      max: 5,
      orphans: emptyOrphans,
      source: 'World',
    });

    expect(examples.map((entry) => entry.source).sort()).toEqual([
      'Cancel',
      'Hello',
      'Save',
    ]);
  });

  it('picks entries other than the source being translated', () => {
    const localeData: LocaleData = {
      sv: {
        'src/a.tsx': {
          Cancel: 'Avbryt',
          Save: 'Spara',
        },
      },
    };

    const examples = extractExamples({
      currentFileId: 'src/a.tsx',
      excludeKey: toMessageKey('Save'),
      locale: 'sv',
      localeData,
      max: 5,
      orphans: emptyOrphans,
      source: 'Save',
    });

    expect(examples.map((entry) => entry.source)).toEqual([
      'Cancel',
    ]);
  });

  it('picks same-file entries first when similarity ties', () => {
    const localeData: LocaleData = {
      sv: {
        'src/a.tsx': {
          Settings: 'Inställningar',
        },
        'src/b.tsx': {
          Cancel: 'Avbryt',
          Save: 'Spara',
        },
      },
    };

    const examples = extractExamples({
      currentFileId: 'src/b.tsx',
      excludeKey: toMessageKey('Hello'),
      locale: 'sv',
      localeData,
      max: 3,
      orphans: emptyOrphans,
      source: 'Hello',
    });

    expect(examples[0]).toMatchObject({
      source: 'Cancel',
    });
  });

  it('returns at most max entries', () => {
    const localeData: LocaleData = {
      sv: {
        'src/a.tsx': {
          Cancel: 'Avbryt',
          Hello: 'Hej',
          'Loading...': 'Laddar...',
          Save: 'Spara',
          Settings: 'Inställningar',
          'Switch account': 'Byt konto',
          World: 'Världen',
        },
      },
    };

    const examples = extractExamples({
      currentFileId: 'src/b.tsx',
      excludeKey: toMessageKey('Save changes'),
      locale: 'sv',
      localeData,
      max: 3,
      orphans: emptyOrphans,
      source: 'Save changes',
    });

    expect(examples).toHaveLength(3);
  });

  it('reads entries from the orphan cache for the target locale', () => {
    const orphans: OrphanCache = {
      'src/a.tsx': {
        [toMessageKey('Save')]: {
          deletedAt: '2026-01-01T00:00:00.000Z',
          translations: {
            sv: 'Spara',
          },
        },
      },
    };

    const examples = extractExamples({
      currentFileId: 'src/b.tsx',
      excludeKey: toMessageKey('Hello'),
      locale: 'sv',
      localeData: {},
      max: 5,
      orphans,
      source: 'Hello',
    });

    expect(examples).toEqual([
      {
        source: 'Save',
        translation: 'Spara',
      },
    ]);
  });

  it('blocks orphan entries that have no translation for the target locale', () => {
    const orphans: OrphanCache = {
      'src/a.tsx': {
        [toMessageKey('Save')]: {
          deletedAt: '2026-01-01T00:00:00.000Z',
          translations: {
            de: 'Speichern',
          },
        },
      },
    };

    const examples = extractExamples({
      currentFileId: 'src/b.tsx',
      excludeKey: toMessageKey('Hello'),
      locale: 'sv',
      localeData: {},
      max: 5,
      orphans,
      source: 'Hello',
    });

    expect(examples).toEqual([]);
  });

  it('picks no orphan entry matching the excluded key', () => {
    const orphans: OrphanCache = {
      'src/a.tsx': {
        [toMessageKey('Save')]: {
          deletedAt: '2026-01-01T00:00:00.000Z',
          translations: {
            sv: 'Spara',
          },
        },
      },
    };

    const examples = extractExamples({
      currentFileId: 'src/a.tsx',
      excludeKey: toMessageKey('Save'),
      locale: 'sv',
      localeData: {},
      max: 5,
      orphans,
      source: 'Save',
    });

    expect(examples).toEqual([]);
  });

  it('picks same-file orphan entries under a different key', () => {
    const orphans: OrphanCache = {
      'src/a.tsx': {
        [toMessageKey('Cancel')]: {
          deletedAt: '2026-01-01T00:00:00.000Z',
          translations: {
            sv: 'Avbryt',
          },
        },
      },
    };

    const examples = extractExamples({
      currentFileId: 'src/a.tsx',
      excludeKey: toMessageKey('Save'),
      locale: 'sv',
      localeData: {},
      max: 5,
      orphans,
      source: 'Save',
    });

    expect(examples).toEqual([
      {
        source: 'Cancel',
        translation: 'Avbryt',
      },
    ]);
  });

  it('folds duplicate sources across files into a single entry', () => {
    const localeData: LocaleData = {
      sv: {
        'src/a.tsx': {
          Save: 'Spara',
        },
        'src/b.tsx': {
          Save: 'Spara',
        },
      },
    };

    const examples = extractExamples({
      currentFileId: 'src/components/c.tsx',
      excludeKey: toMessageKey('Hello'),
      locale: 'sv',
      localeData,
      max: 5,
      orphans: emptyOrphans,
      source: 'Hello',
    });

    expect(examples.filter((entry) => entry.source === 'Save')).toHaveLength(1);
  });

  it('picks similar sources via fuzzy matching above plain alphabetic order', () => {
    const localeData: LocaleData = {
      sv: {
        'src/a.tsx': {
          Cancel: 'Avbryt',
          Save: 'Spara',
        },
      },
    };

    const examples = extractExamples({
      currentFileId: 'src/b.tsx',
      excludeKey: toMessageKey('Save changes'),
      locale: 'sv',
      localeData,
      max: 1,
      orphans: emptyOrphans,
      source: 'Save changes',
    });

    expect(examples[0]).toMatchObject({
      source: 'Save',
    });
  });

  it('prefers an exact source match over other candidates', () => {
    const localeData: LocaleData = {
      sv: {
        'src/a.tsx': {
          Hello: 'Hej',
          Save: 'Spara',
        },
      },
    };

    const examples = extractExamples({
      currentFileId: 'src/b.tsx',
      excludeKey: toMessageKey('Hello'),
      locale: 'sv',
      localeData,
      max: 1,
      orphans: emptyOrphans,
      source: 'Hello',
    });

    expect(examples).toEqual([
      {
        source: 'Hello',
        translation: 'Hej',
      },
    ]);
  });

  it('blocks entries that have no translation for the target locale', () => {
    const localeData: LocaleData = {
      sv: {
        'src/a.tsx': {
          Cancel: '',
          Save: 'Spara',
        },
      },
    };

    const examples = extractExamples({
      currentFileId: 'src/b.tsx',
      excludeKey: toMessageKey('Hello'),
      locale: 'sv',
      localeData,
      max: 5,
      orphans: emptyOrphans,
      source: 'Hello',
    });

    expect(examples.map((entry) => entry.source)).toEqual([
      'Save',
    ]);
  });
});
