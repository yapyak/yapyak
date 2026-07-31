import { fc, it } from '@fast-check/vitest';
import { describe, expect } from 'vitest';

import { parseTemplate } from './parse';

describe('parseTemplate', () => {
  it('parses an empty source to an empty template', () => {
    expect(parseTemplate('').template).toEqual([]);
  });

  it('parses plain text as a single literal node', () => {
    expect(parseTemplate('Hello world').template).toEqual([
      {
        kind: 'literal',
        value: 'Hello world',
      },
    ]);
  });

  it('parses a single placeholder', () => {
    expect(parseTemplate('{name}').template).toEqual([
      {
        kind: 'placeholder',
        name: 'name',
      },
    ]);
  });

  it('normalizes whitespace inside a placeholder name', () => {
    expect(parseTemplate('{  name  }').template).toEqual([
      {
        kind: 'placeholder',
        name: 'name',
      },
    ]);
  });

  it('parses literal-placeholder-literal sequence', () => {
    expect(parseTemplate('Hi {name}!').template).toEqual([
      {
        kind: 'literal',
        value: 'Hi ',
      },
      {
        kind: 'placeholder',
        name: 'name',
      },
      {
        kind: 'literal',
        value: '!',
      },
    ]);
  });

  it('parses multiple distinct placeholders', () => {
    expect(parseTemplate('{a} {b}').template).toEqual([
      {
        kind: 'placeholder',
        name: 'a',
      },
      {
        kind: 'literal',
        value: ' ',
      },
      {
        kind: 'placeholder',
        name: 'b',
      },
    ]);
  });

  it('emits no diagnostics for a well-formed source', () => {
    expect(parseTemplate('Hi {name}').diagnostics).toEqual([]);
  });

  describe('plural', () => {
    it('parses a cardinal plural with one + other branches', () => {
      const { template } = parseTemplate(
        '{count, plural, one {one item} other {many items}}',
      );
      expect(template).toHaveLength(1);
      const node = template[0];
      expect(node?.kind).toBe('plural');
      if (node?.kind !== 'plural') {
        return;
      }
      expect(node.name).toBe('count');
      expect(node.pluralKind).toBe('cardinal');
      expect(node.branches.one).toEqual([
        {
          kind: 'literal',
          value: 'one item',
        },
      ]);
      expect(node.branches.other).toEqual([
        {
          kind: 'literal',
          value: 'many items',
        },
      ]);
    });

    it('parses selectordinal as ordinal plural', () => {
      const { template } = parseTemplate(
        '{place, selectordinal, one {#st} other {#th}}',
      );
      const node = template[0];
      expect(node?.kind).toBe('plural');
      if (node?.kind !== 'plural') {
        return;
      }
      expect(node.pluralKind).toBe('ordinal');
    });

    it('parses exact `=N` branches', () => {
      const { template } = parseTemplate(
        '{count, plural, =0 {none} one {# item} other {# items}}',
      );
      const node = template[0];
      expect(node?.kind).toBe('plural');
      if (node?.kind !== 'plural') {
        return;
      }
      expect(node.branches['=0']).toEqual([
        {
          kind: 'literal',
          value: 'none',
        },
      ]);
    });

    it('parses `#` inside a plural branch as a CountNode', () => {
      const { template } = parseTemplate('{count, plural, other {# items}}');
      const node = template[0];
      expect(node?.kind).toBe('plural');
      if (node?.kind !== 'plural') {
        return;
      }
      expect(node.branches.other).toEqual([
        {
          kind: 'count',
        },
        {
          kind: 'literal',
          value: ' items',
        },
      ]);
    });

    it('parses nested placeholders inside a plural branch', () => {
      const { template } = parseTemplate(
        '{count, plural, one {# message from {name}} other {# messages from {name}}}',
      );
      const node = template[0];
      expect(node?.kind).toBe('plural');
      if (node?.kind !== 'plural') {
        return;
      }
      expect(node.branches.one).toEqual([
        {
          kind: 'count',
        },
        {
          kind: 'literal',
          value: ' message from ',
        },
        {
          kind: 'placeholder',
          name: 'name',
        },
      ]);
    });

    it('emits missing-other when the plural has no `other` branch', () => {
      const source = '{count, plural, one {# item}}';
      const { diagnostics } = parseTemplate(source);
      expect(diagnostics).toEqual([
        {
          name: 'count',
          range: {
            end: source.length,
            start: 0,
          },
          reason: 'missing-other',
        },
      ]);
    });

    it('emits unsupported when the plural body has `offset:N`', () => {
      const source = '{count, plural, offset:1 one {#} other {# more}}';
      const { diagnostics } = parseTemplate(source);
      const offsetStart = source.indexOf('offset:1');
      expect(diagnostics).toContainEqual({
        feature: 'plural offset',
        name: 'count',
        range: {
          end: offsetStart + 'offset:1'.length,
          start: offsetStart,
        },
        reason: 'unsupported',
      });
    });

    it('emits no malformed when the plural body has `offset:N`', () => {
      const { diagnostics } = parseTemplate(
        '{count, plural, offset:1 one {#} other {# more}}',
      );

      expect(
        diagnostics.filter((diagnostic) => diagnostic.reason === 'malformed'),
      ).toHaveLength(0);
    });

    it('emits unknown-keyword for a plural branch outside the CLDR set', () => {
      const { diagnostics } = parseTemplate(
        '{count, plural, oen {# item} other {# items}}',
      );

      expect(diagnostics).toContainEqual(
        expect.objectContaining({
          branch: 'oen',
          name: 'count',
          pluralKind: 'cardinal',
          reason: 'unknown-keyword',
        }),
      );
    });

    it('emits unknown-keyword for a selectordinal branch outside the CLDR set', () => {
      const { diagnostics } = parseTemplate(
        '{count, selectordinal, oen {#st} other {#th}}',
      );

      expect(diagnostics).toContainEqual(
        expect.objectContaining({
          branch: 'oen',
          name: 'count',
          pluralKind: 'ordinal',
          reason: 'unknown-keyword',
        }),
      );
    });

    it('emits no unknown-keyword when every branch is a CLDR keyword', () => {
      const { diagnostics } = parseTemplate(
        '{count, plural, zero {# items} one {# item} two {# items} few {# items} many {# items} other {# items}}',
      );

      expect(diagnostics).toHaveLength(0);
    });

    it('emits no unknown-keyword when a branch is an exact match', () => {
      const { diagnostics } = parseTemplate(
        '{count, plural, =1 {# objekt} other {# objekt}}',
      );

      expect(diagnostics).toHaveLength(0);
    });
  });

  describe('select', () => {
    it('emits no unknown-keyword when a select uses domain branches', () => {
      const { diagnostics } = parseTemplate(
        '{theme, select, dark {Dark mode} other {Light mode}}',
      );

      expect(diagnostics).toHaveLength(0);
    });

    it('parses a select node with branches', () => {
      const { template } = parseTemplate(
        '{gender, select, male {he} female {she} other {they}}',
      );
      const node = template[0];
      expect(node?.kind).toBe('select');
      if (node?.kind !== 'select') {
        return;
      }
      expect(node.name).toBe('gender');
      expect(node.branches.male).toEqual([
        {
          kind: 'literal',
          value: 'he',
        },
      ]);
      expect(node.branches.other).toEqual([
        {
          kind: 'literal',
          value: 'they',
        },
      ]);
    });

    it('preserves plural context into nested select branches', () => {
      const { template } = parseTemplate(
        '{c, plural, one {{g, select, male {he} other {they}} sent #} other {nothing}}',
      );
      const plural = template[0];
      expect(plural?.kind).toBe('plural');
      if (plural?.kind !== 'plural') {
        return;
      }
      const branch = plural.branches.one;
      expect(branch?.[0]?.kind).toBe('select');
      expect(branch?.[2]).toEqual({
        kind: 'count',
      });
    });

    it('emits missing-other when the select has no `other` branch', () => {
      const source = '{gender, select, male {he}}';
      const { diagnostics } = parseTemplate(source);
      expect(diagnostics).toEqual([
        {
          name: 'gender',
          range: {
            end: source.length,
            start: 0,
          },
          reason: 'missing-other',
        },
      ]);
    });
  });

  describe('count', () => {
    it('parses `#` outside any plural branch as a literal', () => {
      expect(parseTemplate('# hash').template).toEqual([
        {
          kind: 'literal',
          value: '# hash',
        },
      ]);
    });
  });

  describe('number', () => {
    it('parses `number` with no style as decimal default', () => {
      const { template } = parseTemplate('{value, number}');
      expect(template).toEqual([
        {
          kind: 'number',
          name: 'value',
          options: {},
        },
      ]);
    });

    it('parses `number, percent`', () => {
      const { template } = parseTemplate('{value, number, percent}');
      expect(template).toEqual([
        {
          kind: 'number',
          name: 'value',
          options: {
            style: 'percent',
          },
        },
      ]);
    });

    it('parses `number, integer`', () => {
      const { template } = parseTemplate('{value, number, integer}');
      expect(template).toEqual([
        {
          kind: 'number',
          name: 'value',
          options: {
            maximumFractionDigits: 0,
          },
        },
      ]);
    });

    it('parses `number, currency CODE`', () => {
      const { template } = parseTemplate('{value, number, currency SEK}');
      expect(template).toEqual([
        {
          kind: 'number',
          name: 'value',
          options: {
            currency: 'SEK',
            style: 'currency',
          },
        },
      ]);
    });

    it('emits unsupported for a number skeleton (`::`)', () => {
      const source = '{amount, number, ::currency/EUR}';
      const { diagnostics } = parseTemplate(source);
      const bodyStart = source.indexOf('::');
      const bodyEnd = source.length - 1;
      expect(diagnostics).toEqual([
        {
          feature: 'number skeleton',
          name: 'amount',
          range: {
            end: bodyEnd,
            start: bodyStart,
          },
          reason: 'unsupported',
        },
      ]);
    });

    it('emits malformed for a lowercase currency code', () => {
      const { diagnostics } = parseTemplate('{cost, number, currency eur}');
      expect(diagnostics).toContainEqual(
        expect.objectContaining({
          message: 'Unsupported currency code "eur".',
          reason: 'malformed',
        }),
      );
    });

    it('emits malformed for a two-letter currency code', () => {
      const { diagnostics } = parseTemplate('{cost, number, currency EU}');
      expect(diagnostics).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('Unsupported currency code "EU"'),
          reason: 'malformed',
        }),
      );
    });

    it('emits malformed for a four-letter currency code', () => {
      const { diagnostics } = parseTemplate('{cost, number, currency EURO}');
      expect(diagnostics).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('Unsupported currency code "EURO"'),
          reason: 'malformed',
        }),
      );
    });

    it('emits malformed for a currency code with digits', () => {
      const { diagnostics } = parseTemplate('{cost, number, currency US1}');
      expect(diagnostics).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('Unsupported currency code "US1"'),
          reason: 'malformed',
        }),
      );
    });

    it('emits malformed for an unknown ISO 4217 code', () => {
      const { diagnostics } = parseTemplate('{cost, number, currency XYZ}');
      expect(diagnostics).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('Unsupported currency code "XYZ"'),
          reason: 'malformed',
        }),
      );
    });

    it('emits unsupported for currency without a code', () => {
      const source = '{cost, number, currency}';
      const { diagnostics } = parseTemplate(source);
      const bodyStart = source.indexOf('currency');
      const bodyEnd = source.length - 1;
      expect(diagnostics).toEqual([
        {
          feature: 'currency without a code',
          name: 'cost',
          range: {
            end: bodyEnd,
            start: bodyStart,
          },
          reason: 'unsupported',
        },
      ]);
    });

    it('emits unsupported for a legacy number pattern', () => {
      const { diagnostics } = parseTemplate('{n, number, #,##0.00}');
      expect(diagnostics[0]?.reason).toBe('unsupported');
    });
  });

  describe('date', () => {
    it('parses `date` with style', () => {
      const { template } = parseTemplate('{when, date, short}');
      expect(template).toEqual([
        {
          kind: 'date',
          name: 'when',
          style: 'short',
        },
      ]);
    });

    it('parses an unknown style as medium and emits an unsupported diagnostic', () => {
      const source = '{when, date, weird}';
      const { diagnostics, template } = parseTemplate(source);
      expect(template).toEqual([
        {
          kind: 'date',
          name: 'when',
          style: 'medium',
        },
      ]);
      const bodyStart = source.indexOf('weird');
      const bodyEnd = bodyStart + 'weird'.length;
      expect(diagnostics).toEqual([
        {
          feature: 'date skeleton or custom pattern',
          name: 'when',
          range: {
            end: bodyEnd,
            start: bodyStart,
          },
          reason: 'unsupported',
        },
      ]);
    });

    it('parses bare `date` as medium with no diagnostic', () => {
      const { diagnostics, template } = parseTemplate('{when, date}');
      expect(template).toEqual([
        {
          kind: 'date',
          name: 'when',
          style: 'medium',
        },
      ]);
      expect(diagnostics).toEqual([]);
    });
  });

  describe('time', () => {
    it('parses `time` with style', () => {
      const { template } = parseTemplate('{when, time, full}');
      expect(template).toEqual([
        {
          kind: 'time',
          name: 'when',
          style: 'full',
        },
      ]);
    });
  });

  describe('errors', () => {
    it('emits malformed for an unbalanced opening brace', () => {
      const { diagnostics } = parseTemplate('Hi {name');
      expect(diagnostics[0]?.reason).toBe('malformed');
    });

    it('emits malformed for an unbalanced closing brace', () => {
      const { diagnostics } = parseTemplate('Hi name}');
      expect(diagnostics[0]?.reason).toBe('malformed');
    });

    it('emits malformed for an empty argument', () => {
      const { diagnostics } = parseTemplate('a {} b');
      expect(diagnostics[0]?.reason).toBe('malformed');
    });

    it('emits malformed for an empty ICU argument name', () => {
      const { diagnostics } = parseTemplate('{, plural, other {x}}');
      expect(diagnostics).toContainEqual(
        expect.objectContaining({
          message: 'empty argument',
          reason: 'malformed',
        }),
      );
    });

    it('emits malformed for a placeholder name containing an unbalanced brace', () => {
      const { diagnostics } = parseTemplate('{a{b}}');
      expect(diagnostics).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('unbalanced brace'),
          reason: 'malformed',
        }),
      );
    });

    it('emits malformed for an unknown argument type', () => {
      const { diagnostics } = parseTemplate('{x, mystery, body}');
      expect(diagnostics[0]?.reason).toBe('malformed');
    });

    it('emits malformed for a branch name without a body', () => {
      const source = '{count, plural, one two {# item} other {# items}}';
      const { diagnostics } = parseTemplate(source);
      const start = source.indexOf('one');

      expect(diagnostics).toContainEqual({
        message: `branch "one" at index ${start}: missing '{' after branch name`,
        range: {
          end: start + 'one'.length,
          start,
        },
        reason: 'malformed',
      });
    });

    it('emits malformed for a branch body without a name', () => {
      const source = '{count, plural, {# item} other {# items}}';
      const { diagnostics } = parseTemplate(source);
      const start = source.indexOf('{# item}');

      expect(diagnostics).toContainEqual({
        message: `branch at index ${start}: missing name before '{'`,
        range: {
          end: start + 1,
          start,
        },
        reason: 'malformed',
      });
    });

    it('emits unsupported for apostrophe escaping', () => {
      const source = "Send '{count}' files";
      const { diagnostics } = parseTemplate(source);
      const start = source.indexOf("'{");
      expect(diagnostics).toContainEqual({
        feature: 'apostrophe escaping',
        name: '',
        range: {
          end: start + 2,
          start,
        },
        reason: 'unsupported',
      });
    });
  });

  describe('range', () => {
    it('emits a diagnostic at the offending `}` for an unbalanced closing brace', () => {
      const source = 'Hi name}';
      const { diagnostics } = parseTemplate(source);
      const start = source.indexOf('}');
      expect(diagnostics).toContainEqual({
        message: `unbalanced '}' at index ${start}: missing opening '{'`,
        range: {
          end: start + 1,
          start,
        },
        reason: 'malformed',
      });
    });

    it('emits a diagnostic spanning from `{` to end of source for an unbalanced opening brace', () => {
      const source = 'Hi {name';
      const { diagnostics } = parseTemplate(source);
      const start = source.indexOf('{');
      expect(diagnostics).toContainEqual({
        message: `unbalanced '{' at index ${start}: missing closing '}'`,
        range: {
          end: source.length,
          start,
        },
        reason: 'malformed',
      });
    });

    it('emits a diagnostic spanning the whole `{}` token for an empty argument', () => {
      const source = 'a {} b';
      const { diagnostics } = parseTemplate(source);
      const start = source.indexOf('{');
      expect(diagnostics).toContainEqual({
        message: 'empty argument',
        range: {
          end: start + 2,
          start,
        },
        reason: 'malformed',
      });
    });

    it('emits a diagnostic at the kind keyword for an unknown argument type', () => {
      const source = '{x, mystery, body}';
      const { diagnostics } = parseTemplate(source);
      const start = source.indexOf('mystery');
      expect(diagnostics).toContainEqual({
        message: 'unknown argument type "mystery"',
        range: {
          end: start + 'mystery'.length,
          start,
        },
        reason: 'malformed',
      });
    });

    it('emits a diagnostic spanning the whole token for a plural missing `other`', () => {
      const source = 'before {n, plural, one {#}} after';
      const { diagnostics } = parseTemplate(source);
      const start = source.indexOf('{n');
      const end = source.indexOf('}}') + 2;
      expect(diagnostics).toContainEqual({
        name: 'n',
        range: {
          end,
          start,
        },
        reason: 'missing-other',
      });
    });

    it('emits a diagnostic spanning the whole token for a select missing `other`', () => {
      const source = 'x {g, select, male {he}} y';
      const { diagnostics } = parseTemplate(source);
      const start = source.indexOf('{g');
      const end = source.indexOf('}}') + 2;
      expect(diagnostics).toContainEqual({
        name: 'g',
        range: {
          end,
          start,
        },
        reason: 'missing-other',
      });
    });

    it('emits a diagnostic at the `offset:N` text inside a plural body', () => {
      const source = '{c, plural, offset:2 one {#} other {# more}}';
      const { diagnostics } = parseTemplate(source);
      const start = source.indexOf('offset:2');
      expect(diagnostics).toContainEqual({
        feature: 'plural offset',
        name: 'c',
        range: {
          end: start + 'offset:2'.length,
          start,
        },
        reason: 'unsupported',
      });
    });

    it('preserves a plural branch when `offset:N` appears in the branch text', () => {
      const source =
        '{c, plural, one {Apply a GMT offset:1 hour} other {# hours}}';
      const { diagnostics } = parseTemplate(source);
      const offsetDiagnostic = diagnostics.find(
        (diagnostic) =>
          diagnostic.reason === 'unsupported' &&
          diagnostic.feature === 'plural offset',
      );
      expect(offsetDiagnostic).toBeUndefined();
    });

    it('emits a diagnostic at the body for a `time` skeleton', () => {
      const source = '{when, time, weird}';
      const { diagnostics } = parseTemplate(source);
      const start = source.indexOf('weird');
      expect(diagnostics).toContainEqual({
        feature: 'time skeleton or custom pattern',
        name: 'when',
        range: {
          end: start + 'weird'.length,
          start,
        },
        reason: 'unsupported',
      });
    });

    it('emits a diagnostic at the body for a legacy number pattern', () => {
      const source = '{n, number, #,##0.00}';
      const { diagnostics } = parseTemplate(source);
      const start = source.indexOf('#,##0.00');
      expect(diagnostics).toContainEqual({
        feature: 'number style "#,##0.00"',
        name: 'n',
        range: {
          end: start + '#,##0.00'.length,
          start,
        },
        reason: 'unsupported',
      });
    });
  });

  describe('unknown format kind', () => {
    it('parses an unknown kind as a plain placeholder', () => {
      const { template } = parseTemplate('{value, weird, stuff}');
      expect(template).toEqual([
        {
          kind: 'placeholder',
          name: 'value',
        },
      ]);
    });
  });

  describe('properties', () => {
    it.prop([
      fc.string(),
    ])('returns a template array for every input string', (source) => {
      const result = parseTemplate(source);
      expect(Array.isArray(result.template)).toBe(true);
      expect(Array.isArray(result.diagnostics)).toBe(true);
    });

    it.prop([
      fc.string(),
    ])(
      'returns the same template on a second parse of the same input',
      (source) => {
        const a = parseTemplate(source);
        const b = parseTemplate(source);
        expect(b.template).toEqual(a.template);
      },
    );
  });

  describe('depth limit', () => {
    it('refuses to throw when select-branch nesting exceeds the depth limit', () => {
      const source = `${'{x,select,other{'.repeat(2000)}#${'}'.repeat(2000)}`;
      expect(() => parseTemplate(source)).not.toThrow();
    });

    it('parses select-branch nesting up to a thousand levels without throwing', () => {
      const source = `${'{x,select,other{'.repeat(1000)}#${'}'.repeat(1000)}`;
      expect(() => parseTemplate(source)).not.toThrow();
    });
  });
});
