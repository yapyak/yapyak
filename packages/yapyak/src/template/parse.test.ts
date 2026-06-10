import { describe, expect, it } from 'vitest';

import { parseTemplate } from './parse';

describe('parseTemplate', () => {
  it('parses an empty source to an empty template', () => {
    expect(parseTemplate('')).toEqual([]);
  });

  it('parses plain text as a single literal node', () => {
    expect(parseTemplate('Hello world')).toEqual([
      { kind: 'literal', value: 'Hello world' },
    ]);
  });

  it('parses a single placeholder', () => {
    expect(parseTemplate('{name}')).toEqual([
      { kind: 'placeholder', name: 'name' },
    ]);
  });

  it('trims whitespace inside a placeholder name', () => {
    expect(parseTemplate('{  name  }')).toEqual([
      { kind: 'placeholder', name: 'name' },
    ]);
  });

  it('parses literal-placeholder-literal sequence', () => {
    expect(parseTemplate('Hi {name}!')).toEqual([
      { kind: 'literal', value: 'Hi ' },
      { kind: 'placeholder', name: 'name' },
      { kind: 'literal', value: '!' },
    ]);
  });

  it('parses multiple distinct placeholders', () => {
    expect(parseTemplate('{a} {b}')).toEqual([
      { kind: 'placeholder', name: 'a' },
      { kind: 'literal', value: ' ' },
      { kind: 'placeholder', name: 'b' },
    ]);
  });

  describe('plural', () => {
    it('parses a cardinal plural with one + other branches', () => {
      const result = parseTemplate(
        '{count, plural, one {one item} other {many items}}',
      );
      expect(result).toHaveLength(1);
      const node = result[0];
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
      const result = parseTemplate(
        '{place, selectordinal, one {#st} other {#th}}',
      );
      const node = result[0];
      expect(node?.kind).toBe('plural');
      if (node?.kind !== 'plural') {
        return;
      }
      expect(node.type).toBe('ordinal');
    });

    it('parses exact `=N` branches', () => {
      const result = parseTemplate(
        '{count, plural, =0 {none} one {# item} other {# items}}',
      );
      const node = result[0];
      if (node?.kind !== 'plural') {
        return;
      }
      expect(node.branches.get('=0')).toEqual([
        { kind: 'literal', value: 'none' },
      ]);
    });

    it('parses `#` inside a plural branch as a CountNode', () => {
      const result = parseTemplate('{count, plural, other {# items}}');
      const node = result[0];
      if (node?.kind !== 'plural') {
        return;
      }
      expect(node.branches.get('other')).toEqual([
        { kind: 'count' },
        { kind: 'literal', value: ' items' },
      ]);
    });

    it('parses nested placeholders inside a plural branch', () => {
      const result = parseTemplate(
        '{count, plural, one {# message from {name}} other {# messages from {name}}}',
      );
      const node = result[0];
      if (node?.kind !== 'plural') {
        return;
      }
      expect(node.branches.get('one')).toEqual([
        { kind: 'count' },
        { kind: 'literal', value: ' message from ' },
        { kind: 'placeholder', name: 'name' },
      ]);
    });
  });

  describe('select', () => {
    it('parses a select node with branches', () => {
      const result = parseTemplate(
        '{gender, select, male {he} female {she} other {they}}',
      );
      const node = result[0];
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
      const result = parseTemplate(
        '{c, plural, one {{g, select, male {he} other {they}} sent #}}',
      );
      const plural = result[0];
      if (plural?.kind !== 'plural') {
        return;
      }
      const branch = plural.branches.get('one');
      expect(branch?.[0]?.kind).toBe('select');
      expect(branch?.[2]).toEqual({ kind: 'count' });
    });
  });

  describe('count', () => {
    it('treats `#` outside any plural branch as a literal', () => {
      expect(parseTemplate('# hash')).toEqual([
        { kind: 'literal', value: '# hash' },
      ]);
    });
  });

  describe('number', () => {
    it('parses `number` with no style as decimal default', () => {
      const result = parseTemplate('{value, number}');
      expect(result).toEqual([{ kind: 'number', name: 'value', options: {} }]);
    });

    it('parses `number, percent`', () => {
      const result = parseTemplate('{value, number, percent}');
      expect(result).toEqual([
        { kind: 'number', name: 'value', options: { style: 'percent' } },
      ]);
    });

    it('parses `number, integer`', () => {
      const result = parseTemplate('{value, number, integer}');
      expect(result).toEqual([
        {
          kind: 'number',
          name: 'value',
          options: { maximumFractionDigits: 0 },
        },
      ]);
    });

    it('parses `number, currency CODE`', () => {
      const result = parseTemplate('{value, number, currency SEK}');
      expect(result).toEqual([
        {
          kind: 'number',
          name: 'value',
          options: { currency: 'SEK', style: 'currency' },
        },
      ]);
    });
  });

  describe('date', () => {
    it('parses `date` with style', () => {
      const result = parseTemplate('{when, date, short}');
      expect(result).toEqual([{ kind: 'date', name: 'when', style: 'short' }]);
    });

    it('falls back to medium for unknown style', () => {
      const result = parseTemplate('{when, date, weird}');
      expect(result).toEqual([{ kind: 'date', name: 'when', style: 'medium' }]);
    });
  });

  describe('time', () => {
    it('parses `time` with style', () => {
      const result = parseTemplate('{when, time, full}');
      expect(result).toEqual([{ kind: 'time', name: 'when', style: 'full' }]);
    });
  });

  describe('errors', () => {
    it('throws on an unbalanced opening brace', () => {
      expect(() => parseTemplate('Hi {name')).toThrow(/Unbalanced '\{'/);
    });

    it('throws on an unbalanced closing brace', () => {
      expect(() => parseTemplate('Hi name}')).toThrow(/Unbalanced '\}'/);
    });
  });

  describe('unknown format kind', () => {
    it('falls back to a plain placeholder for an unknown kind', () => {
      const result = parseTemplate('{value, weird, stuff}');
      expect(result).toEqual([{ kind: 'placeholder', name: 'value' }]);
    });
  });
});
