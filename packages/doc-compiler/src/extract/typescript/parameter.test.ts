import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { extractParameters } from './parameter';

function parseFunction(source: string): ts.FunctionDeclaration {
  const sourceFile = ts.createSourceFile(
    'a.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  const declaration = sourceFile.statements.find(ts.isFunctionDeclaration);
  if (declaration === undefined) {
    throw new Error('expected a function declaration');
  }
  return declaration;
}

describe('extractParameters', () => {
  it('extracts name, type, and required flag for a plain parameter', () => {
    const node = parseFunction('export function greet(name: string): void {}');
    expect(extractParameters(node, node.parameters)).toEqual([
      {
        defaultValue: null,
        description: '',
        name: 'name',
        optional: false,
        shape: '',
        type: [
          {
            kind: 'text',
            text: 'string',
          },
        ],
      },
    ]);
  });

  it('marks a parameter as optional when it carries a `?` token', () => {
    const node = parseFunction('export function greet(name?: string): void {}');
    expect(extractParameters(node, node.parameters)[0]?.optional).toBe(true);
  });

  it('captures an initializer as the parameter default value', () => {
    const node = parseFunction(
      'export function greet(name: string = "World"): void {}',
    );
    expect(extractParameters(node, node.parameters)[0]?.defaultValue).toBe(
      '"World"',
    );
  });

  it('reads a parameter description from its `@param` JSDoc tag', () => {
    const node = parseFunction(
      '/**\n * @param name - The greeting target.\n */\nexport function greet(name: string): void {}',
    );
    expect(extractParameters(node, node.parameters)[0]?.description).toBe(
      'The greeting target.',
    );
  });
});
