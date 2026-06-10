import { describe, expect, it } from 'vitest';

import { parseTemplate } from './parse';

describe('parseTemplate', () => {
  it('parses an empty source to an empty template', () => {
    expect(parseTemplate('').template).toEqual([]);
  });

  it('parses plain text as a single literal node', () => {
    expect(parseTemplate('Hello world').template).toEqual([
      { kind: 'literal', value: 'Hello world' },
    ]);
  });

  it('parses a single placeholder', () => {
    expect(parseTemplate('{name}').template).toEqual([
      { kind: 'placeholder', name: 'name' },
    ]);
  });

  it('trims whitespace inside a placeholder name', () => {
    expect(parseTemplate('{  name  }').template).toEqual([
      { kind: 'placeholder', name: 'name' },
    ]);
  });

  it('parses literal-placeholder-literal sequence', () => {
    expect(parseTemplate('Hi {name}!').template).toEqual([
      { kind: 'literal', value: 'Hi ' },
      { kind: 'placeholder', name: 'name' },
      { kind: 'literal', value: '!' },
    ]);
  });

  it('parses multiple distinct placeholders', () => {
    expect(parseTemplate('{a} {b}').template).toEqual([
      { kind: 'placeholder', name: 'a' },
      { kind: 'literal', value: ' ' },
      { kind: 'placeholder', name: 'b' },
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
      expect(node.type).toBe('cardinal');
      expect(node.branches.get('one')).toEqual([
        { kind: 'literal', value: 'one item' },
      ]);
      expect(node.branches.get('other')).toEqual([
        { kind: 'literal', value: 'many items' },
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
      expect(node.type).toBe('ordinal');
    });

    it('parses exact `=N` branches', () => {
      const { template } = parseTemplate(
        '{count, plural, =0 {none} one {# item} other {# items}}',
      );
      const node = template[0];
      if (node?.kind !== 'plural') {
        return;
      }
      expect(node.branches.get('=0')).toEqual([
        { kind: 'literal', value: 'none' },
      ]);
    });

    it('parses `#` inside a plural branch as a CountNode', () => {
      const { template } = parseTemplate('{count, plural, other {# items}}');
      const node = template[0];
      if (node?.kind !== 'plural') {
        return;
      }
      expect(node.branches.get('other')).toEqual([
        { kind: 'count' },
        { kind: 'literal', value: ' items' },
      ]);
    });

    it('parses nested placeholders inside a plural branch', () => {
      const { template } = parseTemplate(
        '{count, plural, one {# message from {name}} other {# messages from {name}}}',
      );
      const node = template[0];
      if (node?.kind !== 'plural') {
        return;
      }
      expect(node.branches.get('one')).toEqual([
        { kind: 'count' },
        { kind: 'literal', value: ' message from ' },
        { kind: 'placeholder', name: 'name' },
      ]);
    });

    it('emits missing-other when the plural has no `other` branch', () => {
      const { diagnostics } = parseTemplate('{count, plural, one {# item}}');
      expect(diagnostics).toEqual([{ name: 'count', reason: 'missing-other' }]);
    });

    it('emits unsupported when the plural body has `offset:N`', () => {
      const { diagnostics } = parseTemplate(
        '{count, plural, offset:1 one {#} other {# more}}',
      );
      expect(diagnostics).toContainEqual({
        feature: 'plural offset',
        name: 'count',
        reason: 'unsupported',
      });
    });
  });

  describe('select', () => {
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
      expect(node.branches.get('male')).toEqual([
        { kind: 'literal', value: 'he' },
      ]);
      expect(node.branches.get('other')).toEqual([
        { kind: 'literal', value: 'they' },
      ]);
    });

    it('inherits plural context into nested select branches', () => {
      const { template } = parseTemplate(
        '{c, plural, one {{g, select, male {he} other {they}} sent #} other {nothing}}',
      );
      const plural = template[0];
      if (plural?.kind !== 'plural') {
        return;
      }
      const branch = plural.branches.get('one');
      expect(branch?.[0]?.kind).toBe('select');
      expect(branch?.[2]).toEqual({ kind: 'count' });
    });

    it('emits missing-other when the select has no `other` branch', () => {
      const { diagnostics } = parseTemplate('{gender, select, male {he}}');
      expect(diagnostics).toEqual([
        { name: 'gender', reason: 'missing-other' },
      ]);
    });
  });

  describe('count', () => {
    it('treats `#` outside any plural branch as a literal', () => {
      expect(parseTemplate('# hash').template).toEqual([
        { kind: 'literal', value: '# hash' },
      ]);
    });
  });

  describe('number', () => {
    it('parses `number` with no style as decimal default', () => {
      const { template } = parseTemplate('{value, number}');
      expect(template).toEqual([
        { kind: 'number', name: 'value', options: {} },
      ]);
    });

    it('parses `number, percent`', () => {
      const { template } = parseTemplate('{value, number, percent}');
      expect(template).toEqual([
        { kind: 'number', name: 'value', options: { style: 'percent' } },
      ]);
    });

    it('parses `number, integer`', () => {
      const { template } = parseTemplate('{value, number, integer}');
      expect(template).toEqual([
        {
          kind: 'number',
          name: 'value',
          options: { maximumFractionDigits: 0 },
        },
      ]);
    });

    it('parses `number, currency CODE`', () => {
      const { template } = parseTemplate('{value, number, currency SEK}');
      expect(template).toEqual([
        {
          kind: 'number',
          name: 'value',
          options: { currency: 'SEK', style: 'currency' },
        },
      ]);
    });

    it('emits unsupported for a number skeleton (`::`)', () => {
      const { diagnostics } = parseTemplate('{amount, number, ::currency/EUR}');
      expect(diagnostics).toEqual([
        { feature: 'number skeleton', name: 'amount', reason: 'unsupported' },
      ]);
    });

    it('emits unsupported for currency without a code', () => {
      const { diagnostics } = parseTemplate('{cost, number, currency}');
      expect(diagnostics).toEqual([
        {
          feature: 'currency without a code',
          name: 'cost',
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
        { kind: 'date', name: 'when', style: 'short' },
      ]);
    });

    it('falls back to medium for unknown style and emits unsupported', () => {
      const { diagnostics, template } = parseTemplate('{when, date, weird}');
      expect(template).toEqual([
        { kind: 'date', name: 'when', style: 'medium' },
      ]);
      expect(diagnostics).toEqual([
        {
          feature: 'date skeleton or custom pattern',
          name: 'when',
          reason: 'unsupported',
        },
      ]);
    });

    it('treats bare `date` as medium with no diagnostic', () => {
      const { diagnostics, template } = parseTemplate('{when, date}');
      expect(template).toEqual([
        { kind: 'date', name: 'when', style: 'medium' },
      ]);
      expect(diagnostics).toEqual([]);
    });
  });

  describe('time', () => {
    it('parses `time` with style', () => {
      const { template } = parseTemplate('{when, time, full}');
      expect(template).toEqual([{ kind: 'time', name: 'when', style: 'full' }]);
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

    it('emits malformed for an unknown argument type', () => {
      const { diagnostics } = parseTemplate('{x, mystery, body}');
      expect(diagnostics[0]?.reason).toBe('malformed');
    });

    it('emits unsupported for apostrophe escaping', () => {
      const { diagnostics } = parseTemplate("Send '{count}' files");
      expect(diagnostics).toContainEqual({
        feature: 'apostrophe escaping',
        name: '',
        reason: 'unsupported',
      });
    });
  });

  describe('unknown format kind', () => {
    it('falls back to a plain placeholder for an unknown kind', () => {
      const { template } = parseTemplate('{value, weird, stuff}');
      expect(template).toEqual([{ kind: 'placeholder', name: 'value' }]);
    });
  });
});
