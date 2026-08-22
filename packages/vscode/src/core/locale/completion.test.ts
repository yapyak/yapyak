import { describe, expect, it } from 'vitest';
import { parsePlaceholders } from 'yapyak/compiler/internal';
import { parseTemplate } from 'yapyak/template/internal';

import { buildLocaleCompletions } from './completion';

const compiler = {
  parsePlaceholders,
};

describe('buildLocaleCompletions', () => {
  it('returns the placeholder verbatim for a simple source', () => {
    expect(
      buildLocaleCompletions(compiler, {
        locale: 'sv',
        source: 'Hi {name}',
      }),
    ).toEqual([
      {
        detail: 'simple placeholder from the source',
        insertText: '{name}',
        label: '{name}',
      },
    ]);
  });

  it('returns the placeholder verbatim for a date format', () => {
    expect(
      buildLocaleCompletions(compiler, {
        locale: 'sv',
        source: 'Updated: {when, date, long}',
      })[0]?.insertText,
    ).toBe('{when, date, long}');
  });

  it('builds plural branches for the target locale', () => {
    expect(
      buildLocaleCompletions(compiler, {
        locale: 'sv',
        source: 'You have {count, plural, one {# item} other {# items}}',
      })[0]?.insertText,
    ).toBe('{count, plural, one {# $1} other {# $2}}');
  });

  it('builds every plural branch the target locale requires', () => {
    expect(
      buildLocaleCompletions(compiler, {
        locale: 'pl',
        source: 'You have {count, plural, one {# item} other {# items}}',
      })[0]?.label,
    ).toBe('{count, plural, one few many other}');
  });

  it('builds plural branches without `#` when the source has none', () => {
    expect(
      buildLocaleCompletions(compiler, {
        locale: 'sv',
        source: 'You have {count, plural, one {a message} other {messages}}',
      })[0]?.insertText,
    ).toBe('{count, plural, one {$1} other {$2}}');
  });

  it('builds selectordinal branches for the target locale', () => {
    expect(
      buildLocaleCompletions(compiler, {
        locale: 'sv',
        source: '{count, selectordinal, one {#st} other {#th}}',
      })[0]?.detail,
    ).toBe('selectordinal branches for sv');
  });

  it('returns no completion for an unbalanced brace', () => {
    expect(
      buildLocaleCompletions(compiler, {
        locale: 'sv',
        source: 'Hi {name',
      }),
    ).toEqual([]);
  });

  it('returns every placeholder in the source', () => {
    expect(
      buildLocaleCompletions(compiler, {
        locale: 'sv',
        source: 'Hi {name}, you have {count} messages',
      }),
    ).toHaveLength(2);
  });

  it('builds a completion the compiler parses for every locale', () => {
    const sources = [
      'Hi {name}',
      'Updated: {when, date, long}',
      'Price: {amount, number, currency EUR}',
      'You have {count, plural, one {# item} other {# items}}',
      '{count, selectordinal, one {#st} other {#th}}',
    ];
    const failed = [
      'sv',
      'pl',
      'ja',
      'ar',
    ].flatMap((locale) =>
      sources.flatMap((source) =>
        buildLocaleCompletions(compiler, {
          locale,
          source,
        })
          .map((completion) => completion.insertText.replaceAll(/\$\d+/g, 'x'))
          .filter((sample) => parseTemplate(sample).diagnostics.length > 0),
      ),
    );

    expect(failed).toEqual([]);
  });

  it('returns no completions for a source without placeholders', () => {
    expect(
      buildLocaleCompletions(compiler, {
        locale: 'sv',
        source: 'Hello',
      }),
    ).toEqual([]);
  });
});
