import { describe, expect, it } from 'vitest';

import { parsePlaceholders } from './plural';

describe('parsePlaceholders', () => {
  it('parses a simple placeholder', () => {
    const results = parsePlaceholders('Hi {name}');
    expect(results).toEqual([{ kind: 'simple', name: 'name' }]);
  });

  it('parses multiple simple placeholders', () => {
    const results = parsePlaceholders(
      'Hi {name}, you have {count} new messages',
    );
    expect(results.map((r) => r.name)).toEqual(['name', 'count']);
    for (const r of results) expect(r.kind).toBe('simple');
  });

  it('parses a plural with all required branches', () => {
    const source = '{count, plural, one {# item} other {# items}}';
    const [info] = parsePlaceholders(source);
    expect(info?.kind).toBe('plural');
    expect(info?.name).toBe('count');
    expect(info?.invalid).toBeUndefined();
    expect(info?.variants).toEqual({ one: '# item', other: '# items' });
  });

  it('parses `selectordinal` as plural-shaped', () => {
    const source = '{rank, selectordinal, one {#st} other {#th}}';
    const [info] = parsePlaceholders(source);
    expect(info?.kind).toBe('plural');
    expect(info?.invalid).toBeUndefined();
  });

  it('parses select branches', () => {
    const source = '{gender, select, male {he} female {she} other {they}}';
    const [info] = parsePlaceholders(source);
    expect(info?.kind).toBe('select');
    expect(info?.variants).toEqual({
      female: 'she',
      male: 'he',
      other: 'they',
    });
  });

  it('parses a date placeholder', () => {
    const [info] = parsePlaceholders('{when, date, medium}');
    expect(info?.kind).toBe('date');
    expect(info?.name).toBe('when');
  });

  it('parses a number placeholder', () => {
    const [info] = parsePlaceholders('{cost, number, currency}');
    expect(info?.kind).toBe('number');
  });

  it('parses a time placeholder', () => {
    const [info] = parsePlaceholders('{at, time, short}');
    expect(info?.kind).toBe('time');
  });

  it('extracts nested placeholders for plural branches', () => {
    const source = '{count, plural, one {1 {name}} other {# {name}s}}';
    const results = parsePlaceholders(source);
    expect(results).toHaveLength(2);
    expect(results[0]?.name).toBe('count');
    expect(results[0]?.kind).toBe('plural');
    expect(results[1]?.name).toBe('name');
    expect(results[1]?.kind).toBe('simple');
  });

  it('extracts nested placeholders for select branches', () => {
    const source = '{theme, select, dark {Hello {name}} other {Bye {name}}}';
    const results = parsePlaceholders(source);
    expect(results).toHaveLength(2);
    expect(results[0]?.name).toBe('theme');
    expect(results[1]?.name).toBe('name');
  });

  it('extracts nested ICU placeholders', () => {
    const source =
      '{count, plural, one {{when, date, short}} other {{when, date, short}}}';
    const results = parsePlaceholders(source);
    expect(results).toHaveLength(2);
    expect(results[0]?.name).toBe('count');
    expect(results[1]?.name).toBe('when');
    expect(results[1]?.kind).toBe('date');
  });

  it('folds repeated placeholder names', () => {
    const results = parsePlaceholders('{name} and {name} again');
    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe('name');
  });

  it('returns an empty array for source with no placeholders', () => {
    expect(parsePlaceholders('Hello world')).toEqual([]);
  });

  it('emits invalid flag for plural missing `other` branch', () => {
    const source = '{count, plural, one {# item}}';
    const [info] = parsePlaceholders(source);
    expect(info?.kind).toBe('plural');
    expect(info?.invalid).toBe('plural-missing-other');
  });
});
