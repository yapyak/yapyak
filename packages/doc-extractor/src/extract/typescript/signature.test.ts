import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { buildCallSignature, buildOverload } from './signature';

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

function parseInterfaceCallSignature(
  source: string,
): ts.CallSignatureDeclaration {
  const sourceFile = ts.createSourceFile(
    'a.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  const declaration = sourceFile.statements.find(ts.isInterfaceDeclaration);
  if (declaration === undefined) {
    throw new Error('expected an interface declaration');
  }
  const signature = declaration.members.find(ts.isCallSignatureDeclaration);
  if (signature === undefined) {
    throw new Error('expected a call signature');
  }
  return signature;
}

describe('buildOverload', () => {
  it('builds parameters, return type, and signature text from a function declaration', () => {
    const node = parseFunction(
      'export function greet(name: string): string { return "Hello"; }',
    );
    const overload = buildOverload(node);
    expect(overload.signature).toBe(
      'export function greet(name: string): string',
    );
    expect(overload.parameters).toHaveLength(1);
    expect(overload.returnType).toEqual([
      {
        kind: 'text',
        text: 'string',
      },
    ]);
  });

  it('includes type parameters in the result', () => {
    const node = parseFunction(
      'export function identity<T>(value: T): T { return value; }',
    );
    expect(buildOverload(node).typeParameters).toEqual([
      {
        constraint: null,
        defaultType: null,
        description: '',
        name: 'T',
      },
    ]);
  });
});

describe('buildCallSignature', () => {
  it('builds the signature text without the trailing semicolon', () => {
    const node = parseInterfaceCallSignature(
      'interface Greeter { (name: string): string }',
    );
    expect(buildCallSignature(node).signature).toBe('(name: string): string');
  });
});
