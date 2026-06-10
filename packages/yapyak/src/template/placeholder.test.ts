import { describe, expect, it } from 'vitest';

import {
  count,
  date,
  literal,
  number,
  placeholder,
  plural,
  select,
  time,
} from './factory';
import { extractPlaceholders } from './placeholder';

describe('extractPlaceholders', () => {
  it('returns an empty list for an empty template', () => {
    expect(extractPlaceholders([])).toEqual([]);
  });

  it('returns an empty list when the template has only literal nodes', () => {
    expect(extractPlaceholders([literal('Hello'), literal(' world')])).toEqual(
      [],
    );
  });

  it('returns an empty list for a stray count node at the top level', () => {
    expect(extractPlaceholders([count()])).toEqual([]);
  });

  describe('node kinds', () => {
    it('extracts a simple placeholder', () => {
      expect(extractPlaceholders([placeholder('name')])).toEqual([
        { kind: 'simple', name: 'name' },
      ]);
    });

    it('extracts a number placeholder', () => {
      expect(extractPlaceholders([number('value', {})])).toEqual([
        { kind: 'number', name: 'value' },
      ]);
    });

    it('extracts a date placeholder', () => {
      expect(extractPlaceholders([date('when', 'short')])).toEqual([
        { kind: 'date', name: 'when' },
      ]);
    });

    it('extracts a time placeholder', () => {
      expect(extractPlaceholders([time('at', 'full')])).toEqual([
        { kind: 'time', name: 'at' },
      ]);
    });

    it('extracts a cardinal plural as kind `plural`', () => {
      const template = [
        plural('count', 'cardinal', {
          one: [literal('one')],
          other: [literal('many')],
        }),
      ];
      expect(extractPlaceholders(template)).toEqual([
        { kind: 'plural', name: 'count' },
      ]);
    });

    it('extracts an ordinal plural as kind `selectordinal`', () => {
      const template = [
        plural('rank', 'ordinal', {
          one: [literal('1st')],
          other: [literal('nth')],
        }),
      ];
      expect(extractPlaceholders(template)).toEqual([
        { kind: 'selectordinal', name: 'rank' },
      ]);
    });

    it('extracts a select placeholder', () => {
      const template = [
        select('gender', {
          male: [literal('he')],
          other: [literal('they')],
        }),
      ];
      expect(extractPlaceholders(template)).toEqual([
        { kind: 'select', name: 'gender' },
      ]);
    });
  });

  describe('traversal', () => {
    it('walks placeholders nested inside plural branches', () => {
      const template = [
        plural('count', 'cardinal', {
          one: [count(), literal(' from '), placeholder('name')],
          other: [count(), literal(' from '), placeholder('name')],
        }),
      ];
      expect(extractPlaceholders(template)).toEqual([
        { kind: 'plural', name: 'count' },
        { kind: 'simple', name: 'name' },
      ]);
    });

    it('walks placeholders nested inside select branches', () => {
      const template = [
        select('role', {
          admin: [literal('Admin '), placeholder('name')],
          other: [literal('User '), placeholder('name')],
        }),
      ];
      expect(extractPlaceholders(template)).toEqual([
        { kind: 'select', name: 'role' },
        { kind: 'simple', name: 'name' },
      ]);
    });

    it('walks a select nested inside a plural branch', () => {
      const template = [
        plural('count', 'cardinal', {
          one: [
            select('g', {
              male: [literal('he')],
              other: [literal('they')],
            }),
            literal(' sent '),
            count(),
          ],
          other: [literal('many')],
        }),
      ];
      expect(extractPlaceholders(template)).toEqual([
        { kind: 'plural', name: 'count' },
        { kind: 'select', name: 'g' },
      ]);
    });
  });

  describe('dedup', () => {
    it('deduplicates repeated placeholder names', () => {
      const template = [
        placeholder('name'),
        literal(' and '),
        placeholder('name'),
      ];
      expect(extractPlaceholders(template)).toEqual([
        { kind: 'simple', name: 'name' },
      ]);
    });

    it('keeps the first-seen kind when the same name appears with different kinds', () => {
      const template = [
        plural('count', 'cardinal', {
          other: [count()],
        }),
        literal(' and '),
        placeholder('count'),
      ];
      expect(extractPlaceholders(template)).toEqual([
        { kind: 'plural', name: 'count' },
      ]);
    });
  });

  describe('edge cases', () => {
    it('skips placeholders with an empty name', () => {
      expect(extractPlaceholders([placeholder('')])).toEqual([]);
    });

    it('preserves the order of first appearance', () => {
      const template = [
        placeholder('first'),
        literal(' '),
        placeholder('second'),
        literal(' '),
        placeholder('third'),
      ];
      expect(extractPlaceholders(template)).toEqual([
        { kind: 'simple', name: 'first' },
        { kind: 'simple', name: 'second' },
        { kind: 'simple', name: 'third' },
      ]);
    });
  });
});
