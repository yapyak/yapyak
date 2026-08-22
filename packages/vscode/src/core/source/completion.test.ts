import { describe, expect, it } from 'vitest';
import { parseTemplate } from 'yapyak/template/internal';

import { buildSourceCompletions } from './completion';

const CONTEXTS = [
  'Hi {',
  'Hi {count, ',
  'Price: {amount, number, ',
  'Price: {amount, number, currency ',
  'Updated: {when, date, ',
  'At: {when, time, ',
];

function toText(insertText: string): string {
  return insertText
    .replaceAll(
      /\$\{\d+\|([^|]*)\|\}/g,
      (_, choices: string) => choices.split(',')[0] ?? '',
    )
    .replaceAll(/\$\{\d+:([^}]*)\}/g, '$1')
    .replaceAll(/\$\d+/g, 'x');
}

function labels(source: string, offset: number): string[] {
  return buildSourceCompletions(source, offset).map(
    (completion) => completion.label,
  );
}

function insertText(
  source: string,
  offset: number,
  label: string,
): string | undefined {
  return buildSourceCompletions(source, offset).find(
    (completion) => completion.label === label,
  )?.insertText;
}

describe('buildSourceCompletions', () => {
  it('returns no completions outside a placeholder', () => {
    expect(buildSourceCompletions('Hello', 5)).toEqual([]);
  });

  it('returns no completions when the name is being typed', () => {
    expect(buildSourceCompletions('Hi {na', 6)).toEqual([]);
  });

  it('returns every placeholder shape after an opening brace', () => {
    expect(labels('Hi {', 4)).toEqual([
      '{name}',
      '{value, plural}',
      '{value, selectordinal}',
      '{value, select}',
      '{value, number}',
      '{value, date}',
      '{value, time}',
    ]);
  });

  it('returns every kind after the name', () => {
    expect(labels('Hi {count, ', 11)).toEqual([
      'plural',
      'selectordinal',
      'select',
      'number',
      'date',
      'time',
    ]);
  });

  it('returns the number styles after the number kind', () => {
    expect(labels('Price: {amount, number, ', 24)).toEqual([
      'integer',
      'percent',
      'currency',
    ]);
  });

  it('returns every currency the platform supports after `currency`', () => {
    const source = 'Price: {amount, number, currency ';
    const currencies = labels(source, source.length);

    expect(currencies).toEqual(Intl.supportedValuesOf('currency'));
    expect(currencies).toContain('SEK');
  });

  it('returns the currency name as the detail', () => {
    const source = 'Price: {amount, number, currency ';

    expect(
      buildSourceCompletions(source, source.length).find(
        (completion) => completion.label === 'SEK',
      )?.detail,
    ).toBe('Swedish Krona');
  });

  it('returns the date styles after the date kind', () => {
    expect(labels('Updated: {when, date, ', 22)).toEqual([
      'short',
      'medium',
      'long',
      'full',
    ]);
  });

  it('returns the time styles after the time kind', () => {
    expect(labels('At: {when, time, ', 17)).toEqual([
      'short',
      'medium',
      'long',
      'full',
    ]);
  });

  it('returns no styles for a kind that takes none', () => {
    expect(labels('Hi {theme, select, ', 19)).toEqual([]);
  });

  it('builds a closing brace when the source has none', () => {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
    expect(insertText('Hi {', 4, '{name}')).toBe('${1:name}}');
  });

  it('builds no closing brace when the editor already added one', () => {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
    expect(insertText('Hi {}', 4, '{name}')).toBe('${1:name}');
  });

  it('builds a plural body that holds `#`', () => {
    expect(insertText('Hi {count, ', 11, 'plural')).toContain('one {# ');
  });

  it('builds a completion the compiler parses for every context', () => {
    const parsed = CONTEXTS.flatMap((context) =>
      buildSourceCompletions(context, context.length).map((completion) => ({
        diagnostics: parseTemplate(
          `${context}${toText(completion.insertText)}`,
        ).diagnostics.map((diagnostic) => diagnostic.kind),
        sample: `${context}${toText(completion.insertText)}`,
      })),
    ).filter((entry) => entry.diagnostics.length > 0);

    expect(parsed).toEqual([]);
  });

  it('returns the kinds for a placeholder nested in a branch', () => {
    const source = 'You have {count, plural, one {# by {';

    expect(labels(source, source.length)).toContain('{name}');
  });
});
