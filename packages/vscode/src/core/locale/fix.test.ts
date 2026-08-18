import { describe, expect, it } from 'vitest';
import {
  YAP_COMPILE,
  extractFile,
  parsePlaceholders,
  validateIcuPairs,
} from 'yapyak/compiler/internal';

import { resolveLocaleFix } from './fix';

const compiler = {
  YAP_COMPILE,
  parsePlaceholders,
};

function toMessages(source: string) {
  return extractFile(
    'src/a.tsx',
    `import { t } from 'yapyak';\nexport const x = t(${JSON.stringify(source)});\n`,
    {
      processors: [],
    },
  ).messages;
}

function toCodes(
  source: string,
  value: string,
): {
  after: string[];
  before: string[];
} {
  const messages = toMessages(source);
  const toContent = (translation: string): string =>
    JSON.stringify(
      {
        'src/a.tsx': {
          [source]: translation,
        },
      },
      null,
      2,
    );
  const validate = (translation: string): string[] =>
    validateIcuPairs({
      content: toContent(translation),
      fileId: 'locales/sv.json',
      locale: 'sv',
      messages,
    }).map((diagnostic) => diagnostic.code);
  const before = validate(value);
  const fix = resolveLocaleFix(compiler, {
    code: before[0] ?? '',
    source,
    value,
  });
  return {
    after: validate(fix?.value ?? value),
    before,
  };
}

describe('resolveLocaleFix', () => {
  it('resolves the YAP0051 it claims to fix', () => {
    expect(toCodes('Hi {name}', 'Hej {namn}')).toEqual({
      after: [],
      before: [
        'YAP0051',
      ],
    });
  });

  it('resolves the YAP0011 it claims to fix', () => {
    expect(toCodes('Hi {name}', 'Hej')).toEqual({
      after: [],
      before: [
        'YAP0011',
      ],
    });
  });

  it('resolves the YAP0051 it claims to fix for a plural', () => {
    expect(
      toCodes(
        'You have {count, plural, one {# item} other {# items}}',
        'Du har {conut, plural, one {# objekt} other {# objekt}}',
      ),
    ).toEqual({
      after: [],
      before: [
        'YAP0051',
      ],
    });
  });

  it('returns the renamed translation when a placeholder is misspelled', () => {
    expect(
      resolveLocaleFix(compiler, {
        code: YAP_COMPILE.PLACEHOLDER_MISSPELLED_IN_TARGET.code,
        source: 'Hi {name}',
        value: 'Hej {namn}',
      }),
    ).toEqual({
      title: 'Rename {namn} to {name}',
      unambiguous: true,
      value: 'Hej {name}',
    });
  });

  it('returns the renamed translation for a plural placeholder', () => {
    expect(
      resolveLocaleFix(compiler, {
        code: YAP_COMPILE.PLACEHOLDER_MISSPELLED_IN_TARGET.code,
        source: 'You have {count, plural, one {# item} other {# items}}',
        value: 'Du har {conut, plural, one {# objekt} other {# objekt}}',
      })?.value,
    ).toBe('Du har {count, plural, one {# objekt} other {# objekt}}');
  });

  it('returns the translation with the placeholder added when it is missing', () => {
    expect(
      resolveLocaleFix(compiler, {
        code: YAP_COMPILE.PLACEHOLDER_MISSING_IN_TARGET.code,
        source: 'Hi {name}',
        value: 'Hej',
      }),
    ).toEqual({
      title: 'Add {name} to the translation',
      unambiguous: false,
      value: 'Hej {name}',
    });
  });

  it('returns undefined for a code with no fix', () => {
    expect(
      resolveLocaleFix(compiler, {
        code: YAP_COMPILE.PLACEHOLDER_MALFORMED_IN_TARGET.code,
        source: 'Hi {name}',
        value: 'Hej {name',
      }),
    ).toBeUndefined();
  });

  it('returns undefined when two placeholders are misspelled', () => {
    expect(
      resolveLocaleFix(compiler, {
        code: YAP_COMPILE.PLACEHOLDER_MISSPELLED_IN_TARGET.code,
        source:
          'You have {count, plural, one {# by {author}} other {# by {author}}}',
        value:
          'Du har {conut, plural, one {# av {autor}} other {# av {autor}}}',
      }),
    ).toBeUndefined();
  });

  it('returns undefined when two placeholders are missing', () => {
    expect(
      resolveLocaleFix(compiler, {
        code: YAP_COMPILE.PLACEHOLDER_MISSING_IN_TARGET.code,
        source: 'Hi {name}, you have {count} messages',
        value: 'Hej',
      }),
    ).toBeUndefined();
  });

  it('renames every occurrence of the placeholder', () => {
    expect(
      resolveLocaleFix(compiler, {
        code: YAP_COMPILE.PLACEHOLDER_MISSPELLED_IN_TARGET.code,
        source: 'Hi {name}',
        value: 'Hej {namn}, hej {namn}',
      })?.value,
    ).toBe('Hej {name}, hej {name}');
  });

  it('renames a placeholder padded with spaces', () => {
    expect(
      resolveLocaleFix(compiler, {
        code: YAP_COMPILE.PLACEHOLDER_MISSPELLED_IN_TARGET.code,
        source: 'Hi {name}',
        value: 'Hej { namn }',
      })?.value,
    ).toBe('Hej { name }');
  });

  it('renames no placeholder whose name only starts with the misspelling', () => {
    expect(
      resolveLocaleFix(compiler, {
        code: YAP_COMPILE.PLACEHOLDER_MISSPELLED_IN_TARGET.code,
        source: 'Hi {name} {namnx}',
        value: 'Hej {namn} {namnx}',
      })?.value,
    ).toBe('Hej {name} {namnx}');
  });

  it('returns undefined when two placeholders have no match', () => {
    expect(
      resolveLocaleFix(compiler, {
        code: YAP_COMPILE.PLACEHOLDER_MISSPELLED_IN_TARGET.code,
        source: 'Hi {name}',
        value: 'Hej {namn}, {namnx}',
      }),
    ).toBeUndefined();
  });
});
