import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { extractTypeParameters } from './type-parameter';

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

describe('extractTypeParameters', () => {
  it('extracts a generic with its constraint and default type', () => {
    const node = parseFunction(
      'export function pick<T extends string = "Hello">(): T { return "Hello" as T; }',
    );
    expect(extractTypeParameters(node.typeParameters)).toEqual([
      {
        constraint: [
          {
            kind: 'text',
            text: 'string',
          },
        ],
        defaultType: [
          {
            kind: 'text',
            text: '"Hello"',
          },
        ],
        description: '',
        name: 'T',
      },
    ]);
  });

  it('reads a generic description from a matching `@template` tag', () => {
    const node = parseFunction(
      '/**\n * @template T - The source string.\n */\nexport function from<T extends string>(): T { return "Save" as T; }',
    );
    expect(extractTypeParameters(node.typeParameters)[0]?.description).toBe(
      'The source string.',
    );
  });

  it('returns an empty list when the function has no generics', () => {
    const node = parseFunction('export function plain(): void {}');
    expect(extractTypeParameters(node.typeParameters)).toEqual([]);
  });
});
