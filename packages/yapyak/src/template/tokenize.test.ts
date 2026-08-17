import type { TemplateTokenKind } from './tokenize';

import { describe, expect, it } from 'vitest';

import { tokenizeTemplate } from './tokenize';

function collectMarked(source: string, kind: TemplateTokenKind): string[] {
  return tokenizeTemplate(source)
    .filter((token) => token.kind === kind)
    .map((token) => source.slice(token.offset, token.offset + token.length));
}

describe('tokenizeTemplate', () => {
  it('marks a bare placeholder', () => {
    expect(collectMarked('Hi {name}', 'placeholder')).toEqual([
      'name',
    ]);
  });

  it('marks the text around a placeholder', () => {
    expect(collectMarked('Hi {name}', 'text')).toEqual([
      'Hi ',
    ]);
  });

  it('marks the argument kind as a keyword', () => {
    expect(
      collectMarked(
        'You have {count, plural, one {# item} other {# items}}',
        'keyword',
      ),
    ).toEqual([
      'plural',
    ]);
  });

  it('marks every plural branch', () => {
    expect(
      collectMarked(
        'You have {count, plural, one {# item} other {# items}}',
        'branch',
      ),
    ).toEqual([
      'one',
      'other',
    ]);
  });

  it('marks the pound inside a branch', () => {
    expect(
      collectMarked(
        'You have {count, plural, one {# item} other {# items}}',
        'pound',
      ),
    ).toEqual([
      '#',
      '#',
    ]);
  });

  it('marks no pound outside a branch', () => {
    expect(collectMarked('Hi # {name}', 'pound')).toEqual([]);
  });

  it('marks every select branch', () => {
    expect(
      collectMarked(
        '{theme, select, dark {Dark mode} other {Light mode}}',
        'branch',
      ),
    ).toEqual([
      'dark',
      'other',
    ]);
  });

  it('marks a placeholder nested inside a branch', () => {
    expect(
      collectMarked(
        'You have {count, plural, one {# by {author}} other {# by {author}}}',
        'placeholder',
      ),
    ).toEqual([
      'count',
      'author',
      'author',
    ]);
  });

  it('marks a plural nested inside a plural', () => {
    const source =
      '{count, plural, one {{other, plural, one {# item} other {# items}}} other {none}}';

    expect(collectMarked(source, 'keyword')).toEqual([
      'plural',
      'plural',
    ]);
  });

  it('marks the date style as a branch', () => {
    expect(collectMarked('Updated: {when, date, long}', 'branch')).toEqual([
      'long',
    ]);
  });

  it('marks the currency style as a branch', () => {
    expect(
      collectMarked('Price: {amount, number, currency EUR}', 'branch'),
    ).toEqual([
      'currency',
      'EUR',
    ]);
  });

  it('marks a rich-text tag name', () => {
    expect(collectMarked('Click <link>here</link>.', 'tag')).toEqual([
      'link',
      'link',
    ]);
  });

  it('marks a placeholder after an apostrophe', () => {
    expect(collectMarked("It's {name}", 'placeholder')).toEqual([
      'name',
    ]);
  });

  it('marks the whole placeholder as a slot', () => {
    expect(collectMarked('Hi {name}', 'slot')).toEqual([
      '{name}',
    ]);
  });

  it('marks one slot for a placeholder holding branches', () => {
    expect(
      collectMarked(
        'You have {count, plural, one {# item} other {# items}}',
        'slot',
      ),
    ).toEqual([
      '{count, plural, one {# item} other {# items}}',
    ]);
  });

  it('marks no token for an empty source', () => {
    expect(tokenizeTemplate('')).toEqual([]);
  });

  it('marks the text of a source holding no placeholder', () => {
    expect(collectMarked('Save changes', 'text')).toEqual([
      'Save changes',
    ]);
  });

  it('marks the placeholder for an unclosed brace', () => {
    expect(collectMarked('Hi {name', 'placeholder')).toEqual([
      'name',
    ]);
  });

  it('marks the slot to the end of the source for an unclosed brace', () => {
    expect(collectMarked('Hi {name', 'slot')).toEqual([
      '{name',
    ]);
  });

  it('marks no closing punctuation for an unclosed brace', () => {
    expect(collectMarked('Hi {name', 'punctuation')).toEqual([
      '{',
    ]);
  });

  it('marks every branch for a plural missing its closing brace', () => {
    expect(
      collectMarked(
        'You have {count, plural, one {# item} other {# items}',
        'branch',
      ),
    ).toEqual([
      'one',
      'other',
    ]);
  });

  it('marks the pound for a branch missing its closing brace', () => {
    expect(
      collectMarked('You have {count, plural, one {# item', 'pound'),
    ).toEqual([
      '#',
    ]);
  });
});
