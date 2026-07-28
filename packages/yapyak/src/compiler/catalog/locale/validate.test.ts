import type { ExtractedMessage, Location } from '../../parser';
import type { LocaleFile } from './file';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  validateIcuPairs,
  validateLocaleFile,
  validateTranslationParity,
} from './validate';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function emptyRange() {
  return {
    end: {
      column: 0,
      line: 1,
      offset: 0,
    },
    start: {
      column: 0,
      line: 1,
      offset: 0,
    },
  };
}

function makeLocation(fileId = 'src/a.tsx'): Location {
  return {
    callSiteContext: {},
    fileId,
    range: emptyRange(),
  };
}

function makeMessage(source: string, locations: Location[]): ExtractedMessage {
  return {
    id: source,
    locations,
    placeholders: [],
    source,
  };
}

describe('validateLocaleFile', () => {
  let dir: string;
  let path: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'yapyak-validate-'));
    path = join(dir, 'sv.json');
  });

  afterEach(() => {
    rmSync(dir, {
      force: true,
      recursive: true,
    });
  });

  it('returns no diagnostics for a missing file', () => {
    expect(validateLocaleFile('sv.json', path)).toHaveLength(0);
  });

  it('returns no diagnostics for a well-formed file', () => {
    writeFileSync(
      path,
      JSON.stringify({
        'src/a.tsx': {
          Hello: 'Hej',
        },
      }),
    );
    expect(validateLocaleFile('sv.json', path)).toHaveLength(0);
  });

  it('emits YAP0016 when the file is not valid JSON', () => {
    writeFileSync(path, '{ "src/a.tsx": { "Hello": "Hej" ');
    const diagnostics = validateLocaleFile('sv.json', path);

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe('YAP0016');
    expect(diagnostics[0]?.severity).toBe('error');
    expect(diagnostics[0]?.message).toMatch(/not valid JSON/);
  });

  it('emits YAP0013 when entry value is a number', () => {
    writeFileSync(
      path,
      JSON.stringify({
        'src/a.tsx': {
          Hello: 42,
        },
      }),
    );
    const diagnostics = validateLocaleFile('sv.json', path);
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'YAP0013'),
    ).toBe(true);
  });

  it('emits YAP0013 when an entry value is neither string nor object', () => {
    writeFileSync(
      path,
      JSON.stringify({
        'src/a.tsx': {
          Hello: 42,
        },
      }),
    );
    const diagnostics = validateLocaleFile('sv.json', path);
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'YAP0013'),
    ).toBe(true);
  });

  it('emits YAP0013 when a context-variant value is not a string', () => {
    writeFileSync(
      path,
      JSON.stringify({
        'src/a.tsx': {
          Save: {
            button: {
              sv: 'Spara',
            },
          },
        },
      }),
    );
    const diagnostics = validateLocaleFile('sv.json', path);
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'YAP0013'),
    ).toBe(true);
  });

  it('emits no YAP0013 when a context-variant entry has string values', () => {
    writeFileSync(
      path,
      JSON.stringify({
        'src/a.tsx': {
          Save: {
            button: 'Spara',
            toolbar: 'Spara',
          },
        },
      }),
    );
    const diagnostics = validateLocaleFile('sv.json', path);
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'YAP0013'),
    ).toBe(false);
  });

  it('emits YAP0014 for an absolute file-path key', () => {
    writeFileSync(
      path,
      JSON.stringify({
        '/etc/passwd': {
          x: 'y',
        },
      }),
    );
    const diagnostics = validateLocaleFile('sv.json', path);
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'YAP0014'),
    ).toBe(true);
  });

  it('emits YAP0014 for a file-path key with `..`', () => {
    writeFileSync(
      path,
      JSON.stringify({
        '../etc/passwd': {
          x: 'y',
        },
      }),
    );
    const diagnostics = validateLocaleFile('sv.json', path);
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'YAP0014'),
    ).toBe(true);
  });

  it('emits YAP0014 for a file-path key with backslashes', () => {
    writeFileSync(
      path,
      JSON.stringify({
        'src\\a.tsx': {
          x: 'y',
        },
      }),
    );
    const diagnostics = validateLocaleFile('sv.json', path);
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'YAP0014'),
    ).toBe(true);
  });

  it('emits YAP0014 for a `__proto__` file-path key', () => {
    writeFileSync(path, '{"__proto__":{"x":"y"}}');
    const diagnostics = validateLocaleFile('sv.json', path);
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'YAP0014'),
    ).toBe(true);
  });

  it('emits YAP0014 for a `constructor` file-path key', () => {
    writeFileSync(path, '{"constructor":{"x":"y"}}');
    const diagnostics = validateLocaleFile('sv.json', path);
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'YAP0014'),
    ).toBe(true);
  });

  it('emits YAP0015 when a translation string is not Unicode NFC', () => {
    writeFileSync(
      path,
      JSON.stringify({
        'src/a.tsx': {
          Hello: 'Ä',
        },
      }),
    );
    const diagnostics = validateLocaleFile('sv.json', path);
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'YAP0015'),
    ).toBe(true);
  });
});

describe('validateIcuPairs', () => {
  it('returns no diagnostics when source and target have matching placeholders', () => {
    const messages = [
      makeMessage('Hi {name}', [
        makeLocation(),
      ]),
    ];
    const localeFile: LocaleFile = {
      'src/a.tsx': {
        'Hi {name}': 'Hej {name}',
      },
    };
    expect(
      validateIcuPairs('sv.json', 'sv', localeFile, messages),
    ).toHaveLength(0);
  });

  it('returns no diagnostics when target is empty', () => {
    const messages = [
      makeMessage('Hi {name}', [
        makeLocation(),
      ]),
    ];
    const localeFile: LocaleFile = {
      'src/a.tsx': {
        'Hi {name}': '',
      },
    };
    expect(
      validateIcuPairs('sv.json', 'sv', localeFile, messages),
    ).toHaveLength(0);
  });

  it('returns no diagnostics when the target plural uses an exact match branch', () => {
    const source = 'You have {count, plural, one {# item} other {# items}}';
    const messages = [
      makeMessage(source, [
        makeLocation(),
      ]),
    ];
    const localeFile: LocaleFile = {
      'src/a.tsx': {
        [source]: 'Du har {count, plural, =1 {# objekt} other {# objekt}}',
      },
    };
    expect(
      validateIcuPairs('sv.json', 'sv', localeFile, messages),
    ).toHaveLength(0);
  });

  it('returns no diagnostics when the target plural uses locale-required branches', () => {
    const source = 'You have {count, plural, one {# item} other {# items}}';
    const messages = [
      makeMessage(source, [
        makeLocation(),
      ]),
    ];
    const localeFile: LocaleFile = {
      'src/a.tsx': {
        [source]:
          '{count, plural, one {# objekt} few {# objekt} many {# objekt} other {# objekt}}',
      },
    };
    expect(
      validateIcuPairs('pl.json', 'pl', localeFile, messages),
    ).toHaveLength(0);
  });

  it('emits YAP0011 when a placeholder is missing from the translation', () => {
    const messages = [
      makeMessage('Hi {name}', [
        makeLocation(),
      ]),
    ];
    const localeFile: LocaleFile = {
      'src/a.tsx': {
        'Hi {name}': 'Hej där',
      },
    };
    const diagnostics = validateIcuPairs('sv.json', 'sv', localeFile, messages);
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'YAP0011'),
    ).toBe(true);
  });

  it('emits YAP0012 when the translation has an extra placeholder', () => {
    const messages = [
      makeMessage('Hello', [
        makeLocation(),
      ]),
    ];
    const localeFile: LocaleFile = {
      'src/a.tsx': {
        Hello: 'Hej {name}',
      },
    };
    const diagnostics = validateIcuPairs('sv.json', 'sv', localeFile, messages);
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'YAP0012'),
    ).toBe(true);
  });

  it('emits YAP0010 when a placeholder kind differs between source and target', () => {
    const messages = [
      makeMessage('{count, plural, one {# item} other {# items}}', [
        makeLocation(),
      ]),
    ];
    const localeFile: LocaleFile = {
      'src/a.tsx': {
        '{count, plural, one {# item} other {# items}}':
          '{count, select, one {# sak} other {# saker}}',
      },
    };
    const diagnostics = validateIcuPairs('sv.json', 'sv', localeFile, messages);
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'YAP0010'),
    ).toBe(true);
  });

  it('emits YAP0008 when the target plural drops the `other` branch', () => {
    const messages = [
      makeMessage('You have {count, plural, one {# item} other {# items}}', [
        makeLocation(),
      ]),
    ];
    const localeFile: LocaleFile = {
      'src/a.tsx': {
        'You have {count, plural, one {# item} other {# items}}':
          'Du har {count, plural, one {# objekt}}',
      },
    };
    const diagnostics = validateIcuPairs('sv.json', 'sv', localeFile, messages);
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'YAP0008'),
    ).toBe(true);
  });

  it('emits YAP0038 when the target select drops a source-defined branch', () => {
    const source =
      '{theme, select, dark {Dark mode} light {Light mode} other {System}}';
    const messages = [
      makeMessage(source, [
        makeLocation(),
      ]),
    ];
    const localeFile: LocaleFile = {
      'src/a.tsx': {
        [source]: '{theme, select, dark {Mörkt} other {System}}',
      },
    };
    const diagnostics = validateIcuPairs('sv.json', 'sv', localeFile, messages);
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'YAP0038'),
    ).toBe(true);
  });

  it('emits YAP0045 when the target plural uses an unknown branch name', () => {
    const source = 'You have {count, plural, one {# item} other {# items}}';
    const messages = [
      makeMessage(source, [
        makeLocation(),
      ]),
    ];
    const localeFile: LocaleFile = {
      'src/a.tsx': {
        [source]: 'Du har {count, plural, en {# objekt} other {# objekt}}',
      },
    };
    const diagnostics = validateIcuPairs('sv.json', 'sv', localeFile, messages);
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'YAP0045'),
    ).toBe(true);
  });

  it('emits YAP0045 when the target plural uses a category of another locale', () => {
    const source = 'You have {count, plural, one {# item} other {# items}}';
    const messages = [
      makeMessage(source, [
        makeLocation(),
      ]),
    ];
    const localeFile: LocaleFile = {
      'src/a.tsx': {
        [source]:
          'Du har {count, plural, one {# objekt} few {# objekt} other {# objekt}}',
      },
    };
    const diagnostics = validateIcuPairs('sv.json', 'sv', localeFile, messages);
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'YAP0045'),
    ).toBe(true);
  });

  it('emits YAP0045 when the target selectordinal uses an unknown branch name', () => {
    const source =
      '{count, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}';
    const messages = [
      makeMessage(source, [
        makeLocation(),
      ]),
    ];
    const localeFile: LocaleFile = {
      'src/a.tsx': {
        [source]: '{count, selectordinal, two {#nd} other {#th}}',
      },
    };
    const diagnostics = validateIcuPairs('sv.json', 'sv', localeFile, messages);
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'YAP0045'),
    ).toBe(true);
  });

  it('emits no YAP0045 when the target select uses domain branches', () => {
    const source =
      '{theme, select, dark {Dark mode} light {Light mode} other {System}}';
    const messages = [
      makeMessage(source, [
        makeLocation(),
      ]),
    ];
    const localeFile: LocaleFile = {
      'src/a.tsx': {
        [source]: '{theme, select, dark {Mörkt} other {System}}',
      },
    };
    const diagnostics = validateIcuPairs('sv.json', 'sv', localeFile, messages);
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'YAP0045'),
    ).toBe(false);
  });
});

describe('validateTranslationParity', () => {
  it('returns `ok: true` for a placeholder-free source and target', () => {
    expect(validateTranslationParity('Hello', 'Hej').ok).toBe(true);
  });

  it('returns `ok: true` when every source placeholder is preserved', () => {
    expect(validateTranslationParity('Hi {name}', 'Hej {name}').ok).toBe(true);
  });

  it('returns a `missing` issue when a source placeholder is dropped', () => {
    const result = validateTranslationParity('Hi {name}', 'Hej');
    expect(result.ok).toBe(false);
    expect(result.issues).toEqual([
      {
        kind: 'missing',
        name: 'name',
        sourceKind: 'simple',
      },
    ]);
  });

  it('returns an `extra` issue when the target invents a placeholder', () => {
    const result = validateTranslationParity('Hi', 'Hej {name}');
    expect(result.ok).toBe(false);
    expect(result.issues).toEqual([
      {
        kind: 'extra',
        name: 'name',
      },
    ]);
  });

  it('returns a `kind-mismatch` issue when the placeholder kind diverges', () => {
    const result = validateTranslationParity(
      '{count, plural, one {one} other {many}}',
      '{count, select, one {ett} other {flera}}',
    );
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.kind).toBe('kind-mismatch');
  });

  it('returns a `missing-other-branch` issue when the target plural drops `other`', () => {
    const result = validateTranslationParity(
      '{count, plural, one {# item} other {# items}}',
      '{count, plural, one {# objekt}}',
    );
    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({
      kind: 'missing-other-branch',
      name: 'count',
    });
  });

  it('returns a `missing-other-branch` issue when the target select drops `other`', () => {
    const result = validateTranslationParity(
      '{theme, select, dark {Dark mode} other {Light mode}}',
      '{theme, select, dark {Mörkt}}',
    );
    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({
      kind: 'missing-other-branch',
      name: 'theme',
    });
  });

  it('returns a `missing-select-branch` issue when the target select drops a domain branch', () => {
    const result = validateTranslationParity(
      '{theme, select, dark {Dark mode} light {Light mode} other {System}}',
      '{theme, select, dark {Mörkt} other {System}}',
    );
    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({
      branch: 'light',
      kind: 'missing-select-branch',
      name: 'theme',
    });
  });

  it('returns `ok: true` when target plural adds locale-required branches beyond source', () => {
    const result = validateTranslationParity(
      '{count, plural, one {# item} other {# items}}',
      '{count, plural, one {# objekt} few {# objekt} many {# objekt} other {# objekt}}',
    );
    expect(result.ok).toBe(true);
  });
});
