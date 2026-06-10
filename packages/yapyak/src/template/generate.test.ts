import type { Template } from './node';

import { describe, expect, it } from 'vitest';

import { resolveFormatter } from '../formatter';
import { generateTemplate } from './generate';
import { interpret } from './interpret';
import { parseTemplate } from './parse';

type CompiledFn = (params: Record<string, unknown>, locale: string) => string;

function compile(template: Template): CompiledFn {
  const code = generateTemplate(template);
  // biome-ignore lint/security/noGlobalEval: needed
  const factory = new Function(
    'resolveFormatter',
    'toDate',
    `return (params, locale) => ${code};`,
  ) as (rf: typeof resolveFormatter, td: typeof toDate) => CompiledFn;
  return factory(resolveFormatter, toDate);
}

function toDate(value: unknown): Date | undefined {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }
  if (typeof value === 'number' || typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
}

interface Fixture {
  locale: string;
  name: string;
  params: Record<string, unknown>;
  source: string;
}

const fixtures: Fixture[] = [
  { locale: 'en', name: 'empty', params: {}, source: '' },
  { locale: 'en', name: 'plain literal', params: {}, source: 'Hello' },
  {
    locale: 'en',
    name: 'single placeholder',
    params: { name: 'Ada' },
    source: 'Hi {name}',
  },
  {
    locale: 'en',
    name: 'missing placeholder',
    params: {},
    source: 'Hi {name}',
  },
  {
    locale: 'en',
    name: 'multiple placeholders',
    params: { count: 3, name: 'Ada' },
    source: 'Hi {name}, you have {count} left',
  },
  {
    locale: 'en',
    name: 'plural one',
    params: { count: 1 },
    source: '{count, plural, one {# item} other {# items}}',
  },
  {
    locale: 'en',
    name: 'plural other',
    params: { count: 5 },
    source: '{count, plural, one {# item} other {# items}}',
  },
  {
    locale: 'en',
    name: 'plural exact =0',
    params: { count: 0 },
    source: '{count, plural, =0 {none} one {# item} other {# items}}',
  },
  {
    locale: 'en',
    name: 'plural with grouping',
    params: { count: 1234 },
    source: '{count, plural, other {# items}}',
  },
  {
    locale: 'en',
    name: 'select male',
    params: { gender: 'male' },
    source: '{gender, select, male {he} female {she} other {they}}',
  },
  {
    locale: 'en',
    name: 'select other fallback',
    params: { gender: 'unknown' },
    source: '{gender, select, male {he} other {they}}',
  },
  {
    locale: 'en',
    name: 'select nested in plural',
    params: { count: 1, g: 'male' },
    source:
      '{count, plural, one {{g, select, male {he} other {they}} sent #} other {{g, select, male {he} other {they}} sent #}}',
  },
  {
    locale: 'en',
    name: 'number percent',
    params: { value: 0.25 },
    source: '{value, number, percent}',
  },
  {
    locale: 'en',
    name: 'number currency',
    params: { value: 199 },
    source: '{value, number, currency USD}',
  },
  {
    locale: 'en',
    name: 'number null',
    params: { value: null },
    source: '{value, number}',
  },
  {
    locale: 'en',
    name: 'date short',
    params: { when: new Date('2026-06-10T00:00:00Z') },
    source: '{when, date, short}',
  },
  {
    locale: 'en',
    name: 'date invalid',
    params: { when: 'not-a-date' },
    source: '{when, date, short}',
  },
  {
    locale: 'en',
    name: 'time full',
    params: { when: new Date('2026-06-10T12:34:00Z') },
    source: '{when, time, full}',
  },
];

describe('generateTemplate', () => {
  it('emits an empty-string literal for an empty template', () => {
    expect(generateTemplate([])).toBe("''");
  });

  it('emits a JSON-quoted string for a single literal', () => {
    expect(generateTemplate([{ kind: 'literal', value: 'Hello' }])).toBe(
      JSON.stringify('Hello'),
    );
  });

  it('emits a params access for a placeholder', () => {
    const code = generateTemplate([{ kind: 'placeholder', name: 'name' }]);
    expect(code).toContain('params["name"]');
    expect(code).toContain('undefined');
  });

  it('joins multiple nodes with `+`', () => {
    const code = generateTemplate([
      { kind: 'literal', value: 'Hi ' },
      { kind: 'placeholder', name: 'name' },
    ]);
    expect(code).toContain('+');
  });

  describe('semantic equivalence with interpret', () => {
    for (const fixture of fixtures) {
      it(`matches interpret for: ${fixture.name}`, () => {
        const template = parseTemplate(fixture.source).template;
        const compiled = compile(template);
        const generated = compiled(fixture.params, fixture.locale);
        const interpreted = interpret(template, fixture.params, fixture.locale);
        expect(generated).toBe(interpreted);
      });
    }
  });
});
