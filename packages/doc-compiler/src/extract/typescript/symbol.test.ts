import type { BuildSymbolInput } from './symbol';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { buildSymbol } from './symbol';

function parseFirstStatement(source: string): {
  node: ts.Statement;
  sourceFile: ts.SourceFile;
} {
  const sourceFile = ts.createSourceFile(
    '/pkg/src/a.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  const node = sourceFile.statements[0];
  if (node === undefined) {
    throw new Error('expected a statement');
  }
  return {
    node,
    sourceFile,
  };
}

function inputFor(name: string, source: string): BuildSymbolInput {
  const { node, sourceFile } = parseFirstStatement(source);
  return {
    name,
    node,
    packageDir: '/pkg',
    sourceFile,
  };
}

describe('buildSymbol', () => {
  it('builds a function symbol with kind `function` and a single overload', () => {
    const symbol = buildSymbol(
      inputFor(
        'greet',
        'export function greet(name: string): string { return name; }',
      ),
    );
    expect(symbol?.kind).toBe('function');
    if (symbol?.kind === 'function') {
      expect(symbol.overloads).toHaveLength(1);
    }
  });

  it('builds a type-alias symbol carrying members for an object literal alias', () => {
    const symbol = buildSymbol(
      inputFor('Settings', 'export type Settings = { theme: string };'),
    );
    expect(symbol?.kind).toBe('type');
    if (symbol?.kind === 'type') {
      expect(symbol.members).toHaveLength(1);
      expect(symbol.members[0]?.name).toBe('theme');
    }
  });

  it('builds an interface symbol with members and call signatures', () => {
    const symbol = buildSymbol(
      inputFor(
        'Greeter',
        'export interface Greeter { (name: string): string; label: string; }',
      ),
    );
    expect(symbol?.kind).toBe('interface');
    if (symbol?.kind === 'interface') {
      expect(symbol.callSignatures).toHaveLength(1);
      expect(symbol.members).toHaveLength(1);
    }
  });

  it('builds a variable symbol with the declared type', () => {
    const symbol = buildSymbol(
      inputFor('greeting', 'export const greeting: string = "Hello";'),
    );
    expect(symbol?.kind).toBe('variable');
    if (symbol?.kind === 'variable') {
      expect(symbol.type).toEqual([
        {
          kind: 'text',
          text: 'string',
        },
      ]);
    }
  });

  it('records the source location relative to the package directory', () => {
    const symbol = buildSymbol(
      inputFor('greeting', 'export const greeting = "Hello";'),
    );
    expect(symbol?.location).toEqual({
      column: 1,
      file: 'src/a.ts',
      line: 1,
    });
  });

  it('returns undefined for an unsupported statement kind', () => {
    const symbol = buildSymbol(
      inputFor('throwStmt', 'throw new Error("Cancel");'),
    );
    expect(symbol).toBeUndefined();
  });
});
