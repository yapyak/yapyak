import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { extractJsDoc } from './jsdoc';

function parseFirstStatement(source: string): ts.Statement {
  const sourceFile = ts.createSourceFile(
    'a.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  const statement = sourceFile.statements[0];
  if (statement === undefined) {
    throw new Error('expected a statement');
  }
  return statement;
}

describe('extractJsDoc', () => {
  it('returns an empty result for a node without JSDoc', () => {
    const node = parseFirstStatement('export const greeting = "Hello";');
    expect(extractJsDoc(node)).toEqual({
      deprecated: null,
      description: '',
      examples: [],
      remarks: '',
      seeAlso: [],
      shape: '',
      tags: [],
      throws: [],
    });
  });

  it('extracts the summary description from a leading JSDoc block', () => {
    const node = parseFirstStatement(
      '/** Greets the user. */\nexport const greeting = "Hello";',
    );
    expect(extractJsDoc(node).description).toBe('Greets the user.');
  });

  it('extracts `@remarks` content as remarks', () => {
    const node = parseFirstStatement(
      '/**\n * Greets.\n * @remarks Stays polite.\n */\nexport const greeting = "Hello";',
    );
    expect(extractJsDoc(node).remarks).toBe('Stays polite.');
  });

  it('extracts `@shape` content as the shape string', () => {
    const node = parseFirstStatement(
      "/**\n * Locale value.\n * @shape 'en' | 'sv'\n */\nexport const locale = \"en\";",
    );
    expect(extractJsDoc(node).shape).toBe(`'en' | 'sv'`);
  });

  it('extracts `@deprecated` content as the deprecated message', () => {
    const node = parseFirstStatement(
      '/**\n * Old API.\n * @deprecated Use the new API.\n */\nexport const greeting = "Hello";',
    );
    expect(extractJsDoc(node).deprecated).toBe('Use the new API.');
  });

  it('extracts `@see` entries as see-also strings', () => {
    const node = parseFirstStatement(
      '/**\n * Setting.\n * @see Settings\n * @see Other\n */\nexport const greeting = "Settings";',
    );
    expect(extractJsDoc(node).seeAlso).toEqual([
      'Settings',
      'Other',
    ]);
  });

  it('keeps the full URL when `@see` targets an external link', () => {
    const node = parseFirstStatement(
      '/**\n * Setting.\n * @see https://example.com/docs\n */\nexport const greeting = "Settings";',
    );
    expect(extractJsDoc(node).seeAlso).toEqual([
      'https://example.com/docs',
    ]);
  });

  it('extracts `@throws` with a brace-delimited error class', () => {
    const node = parseFirstStatement(
      '/**\n * @throws {RangeError} When out of bounds.\n */\nexport function step(): void {}',
    );
    expect(extractJsDoc(node).throws).toEqual([
      {
        condition: 'When out of bounds.',
        errorClass: 'RangeError',
      },
    ]);
  });

  it('extracts an `@example` fenced code block', () => {
    const node = parseFirstStatement(
      '/**\n * @example Save the form\n * ```ts\n * save();\n * ```\n */\nexport function save(): void {}',
    );
    expect(extractJsDoc(node).examples).toEqual([
      {
        code: 'save();',
        language: 'ts',
        path: null,
        title: 'Save the form',
      },
    ]);
  });

  it('preserves unknown JSDoc tags as generic tags', () => {
    const node = parseFirstStatement(
      '/**\n * @custom payload\n */\nexport const greeting = "Hello";',
    );
    expect(extractJsDoc(node).tags).toEqual([
      {
        name: 'custom',
        text: 'payload',
      },
    ]);
  });
});
