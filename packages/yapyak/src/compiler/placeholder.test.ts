import { describe, expect, it } from 'vitest';

import { parsePlaceholders } from './placeholder';

describe('parsePlaceholders', () => {
  it('parses a simple placeholder', () => {
    const { issues, placeholders } = parsePlaceholders('Hi {name}');
    expect(placeholders).toEqual([
      {
        kind: 'simple',
        name: 'name',
      },
    ]);
    expect(issues).toEqual([]);
  });

  it('parses multiple simple placeholders', () => {
    const { placeholders } = parsePlaceholders('Hi {name}, you have {count}');
    expect(placeholders).toEqual([
      {
        kind: 'simple',
        name: 'name',
      },
      {
        kind: 'simple',
        name: 'count',
      },
    ]);
  });

  it('parses a number placeholder', () => {
    const { issues, placeholders } = parsePlaceholders('{n, number, integer}');
    expect(placeholders).toEqual([
      {
        kind: 'number',
        name: 'n',
      },
    ]);
    expect(issues).toEqual([]);
  });

  it('parses a bare number placeholder', () => {
    const { issues, placeholders } = parsePlaceholders('{n, number}');
    expect(placeholders).toEqual([
      {
        kind: 'number',
        name: 'n',
      },
    ]);
    expect(issues).toEqual([]);
  });

  it('parses a `decimal` number placeholder', () => {
    const { issues, placeholders } = parsePlaceholders('{n, number, decimal}');
    expect(placeholders).toEqual([
      {
        kind: 'number',
        name: 'n',
      },
    ]);
    expect(issues).toEqual([]);
  });

  it('parses a `percent` number placeholder', () => {
    const { issues, placeholders } = parsePlaceholders('{p, number, percent}');
    expect(placeholders).toEqual([
      {
        kind: 'number',
        name: 'p',
      },
    ]);
    expect(issues).toEqual([]);
  });

  it('parses a currency placeholder with a code', () => {
    const { issues, placeholders } = parsePlaceholders(
      '{cost, number, currency EUR}',
    );
    expect(placeholders).toEqual([
      {
        kind: 'number',
        name: 'cost',
      },
    ]);
    expect(issues).toEqual([]);
  });

  it('parses a date placeholder', () => {
    const { placeholders } = parsePlaceholders('{when, date, long}');
    expect(placeholders).toEqual([
      {
        kind: 'date',
        name: 'when',
      },
    ]);
  });

  it('parses a bare date placeholder', () => {
    const { issues, placeholders } = parsePlaceholders('{when, date}');
    expect(placeholders).toEqual([
      {
        kind: 'date',
        name: 'when',
      },
    ]);
    expect(issues).toEqual([]);
  });

  it('parses a time placeholder', () => {
    const { placeholders } = parsePlaceholders('{at, time, short}');
    expect(placeholders).toEqual([
      {
        kind: 'time',
        name: 'at',
      },
    ]);
  });

  it('parses a bare time placeholder', () => {
    const { issues, placeholders } = parsePlaceholders('{at, time}');
    expect(placeholders).toEqual([
      {
        kind: 'time',
        name: 'at',
      },
    ]);
    expect(issues).toEqual([]);
  });

  it('parses a plural placeholder', () => {
    const { issues, placeholders } = parsePlaceholders(
      '{count, plural, one {# item} other {# items}}',
    );
    expect(placeholders).toEqual([
      {
        kind: 'plural',
        name: 'count',
      },
    ]);
    expect(issues).toEqual([]);
  });

  it('parses a selectordinal placeholder', () => {
    const { placeholders } = parsePlaceholders(
      '{rank, selectordinal, one {#st} other {#th}}',
    );
    expect(placeholders).toEqual([
      {
        kind: 'selectordinal',
        name: 'rank',
      },
    ]);
  });

  it('parses a select placeholder', () => {
    const { placeholders } = parsePlaceholders(
      '{gender, select, male {he} other {they}}',
    );
    expect(placeholders).toEqual([
      {
        kind: 'select',
        name: 'gender',
      },
    ]);
  });

  it('extracts nested placeholders from select branches', () => {
    const { issues, placeholders } = parsePlaceholders(
      '{role, select, admin {Admin {name}} other {User {name}}}',
    );
    expect(placeholders).toEqual([
      {
        kind: 'select',
        name: 'role',
      },
      {
        kind: 'simple',
        name: 'name',
      },
    ]);
    expect(issues).toEqual([]);
  });

  it('extracts nested placeholders from plural branches', () => {
    const { placeholders } = parsePlaceholders(
      '{count, plural, one {# from {author}} other {# from {author}}}',
    );
    expect(placeholders).toEqual([
      {
        kind: 'plural',
        name: 'count',
      },
      {
        kind: 'simple',
        name: 'author',
      },
    ]);
  });

  it('extracts nested ICU placeholders for a select inside a plural', () => {
    const { placeholders } = parsePlaceholders(
      '{count, plural, one {{g, select, male {he} other {they}} sent #} other {{g, select, male {he} other {they}} sent #}}',
    );
    expect(placeholders).toEqual([
      {
        kind: 'plural',
        name: 'count',
      },
      {
        kind: 'select',
        name: 'g',
      },
    ]);
  });

  it('folds repeated placeholder names', () => {
    const { placeholders } = parsePlaceholders('{name} and {name} again');
    expect(placeholders).toEqual([
      {
        kind: 'simple',
        name: 'name',
      },
    ]);
  });

  it('returns no placeholders for a source with none', () => {
    const { issues, placeholders } = parsePlaceholders('Hello world');
    expect(placeholders).toEqual([]);
    expect(issues).toEqual([]);
  });

  it('returns no placeholders for markup tags', () => {
    const { issues, placeholders } = parsePlaceholders(
      'Read our <link>terms</link> and <b>privacy</b>',
    );
    expect(placeholders).toEqual([]);
    expect(issues).toEqual([]);
  });

  it('parses a placeholder wrapped in markup tags', () => {
    const { issues, placeholders } = parsePlaceholders('Hi <b>{name}</b>');
    expect(placeholders).toEqual([
      {
        kind: 'simple',
        name: 'name',
      },
    ]);
    expect(issues).toEqual([]);
  });

  it('warns on a plural missing the `other` branch', () => {
    const { issues } = parsePlaceholders('{count, plural, one {# item}}');
    expect(issues).toMatchObject([
      {
        kind: 'missing-other',
        name: 'count',
      },
    ]);
  });

  it('warns on a selectordinal missing the `other` branch', () => {
    const { issues } = parsePlaceholders('{rank, selectordinal, one {#st}}');
    expect(issues).toMatchObject([
      {
        kind: 'missing-other',
        name: 'rank',
      },
    ]);
  });

  it('warns on a select missing the `other` branch', () => {
    const { issues } = parsePlaceholders('{gender, select, male {he}}');
    expect(issues).toMatchObject([
      {
        kind: 'missing-other',
        name: 'gender',
      },
    ]);
  });

  it('warns on a number skeleton as unsupported', () => {
    const { issues } = parsePlaceholders('{amount, number, ::currency/EUR}');
    expect(issues).toMatchObject([
      {
        feature: 'number skeleton',
        kind: 'unsupported',
        name: 'amount',
      },
    ]);
  });

  it('warns on a currency without a code as unsupported', () => {
    const { issues } = parsePlaceholders('{cost, number, currency}');
    expect(issues).toMatchObject([
      {
        feature: 'currency without a code',
        kind: 'unsupported',
        name: 'cost',
      },
    ]);
  });

  it('warns on a legacy number pattern as unsupported', () => {
    const { issues } = parsePlaceholders('{n, number, #,##0.00}');
    expect(issues[0]?.kind).toBe('unsupported');
  });

  it('warns on a date skeleton as unsupported', () => {
    const { issues } = parsePlaceholders('{when, date, ::yyyyMMdd}');
    expect(issues).toMatchObject([
      {
        feature: 'date skeleton or custom pattern',
        kind: 'unsupported',
        name: 'when',
      },
    ]);
  });

  it('warns on a date custom pattern as unsupported', () => {
    const { issues } = parsePlaceholders('{when, date, dd/MM/yyyy}');
    expect(issues).toMatchObject([
      {
        feature: 'date skeleton or custom pattern',
        kind: 'unsupported',
        name: 'when',
      },
    ]);
  });

  it('warns on a time skeleton as unsupported', () => {
    const { issues } = parsePlaceholders('{at, time, ::Hms}');
    expect(issues).toMatchObject([
      {
        feature: 'time skeleton or custom pattern',
        kind: 'unsupported',
        name: 'at',
      },
    ]);
  });

  it('warns on an unsupported time style', () => {
    const { issues } = parsePlaceholders('{at, time, fancy}');
    expect(issues).toMatchObject([
      {
        feature: 'time skeleton or custom pattern',
        kind: 'unsupported',
        name: 'at',
      },
    ]);
  });

  it('warns on a plural offset as unsupported', () => {
    const { issues } = parsePlaceholders(
      '{count, plural, offset:1 one {#} other {# more}}',
    );
    expect(issues).toMatchObject([
      {
        feature: 'plural offset',
        kind: 'unsupported',
        name: 'count',
      },
    ]);
  });

  it('warns on apostrophe escaping as unsupported', () => {
    const { issues } = parsePlaceholders("Send '{count}' files");
    expect(issues).toMatchObject([
      {
        feature: 'apostrophe escaping',
        kind: 'unsupported',
        name: '',
      },
    ]);
  });

  it('warns on an unbalanced brace as malformed', () => {
    const { issues } = parsePlaceholders('Hello {name');
    expect(issues[0]?.kind).toBe('malformed');
  });

  it('warns on an empty argument as malformed', () => {
    const { issues } = parsePlaceholders('a {} b');
    expect(issues[0]?.kind).toBe('malformed');
  });

  it('warns on an unknown argument type as malformed', () => {
    const { issues } = parsePlaceholders('{x, mystery, body}');
    expect(issues[0]?.kind).toBe('malformed');
  });
});
