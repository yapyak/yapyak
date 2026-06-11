import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { resolveBindings } from './binding';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const FIXTURES = join(import.meta.dirname, 'fixture/binding');

function loadFixture(name: string): ts.SourceFile {
  const source = readFileSync(join(FIXTURES, name), 'utf-8');
  return ts.createSourceFile(
    name,
    source,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );
}

function parseSource(source: string): ts.SourceFile {
  return ts.createSourceFile(
    'inline.ts',
    source,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );
}

function findFirstCallExpression(
  node: ts.Node,
  name: string,
): ts.CallExpression | undefined {
  let found: ts.CallExpression | undefined;
  const visit = (n: ts.Node): void => {
    if (found !== undefined) {
      return;
    }
    if (
      ts.isCallExpression(n) &&
      ts.isIdentifier(n.expression) &&
      n.expression.text === name
    ) {
      found = n;
      return;
    }
    ts.forEachChild(n, visit);
  };
  visit(node);
  return found;
}

function findFirstIfStatement(node: ts.Node): ts.IfStatement | undefined {
  let found: ts.IfStatement | undefined;
  const visit = (n: ts.Node): void => {
    if (found !== undefined) {
      return;
    }
    if (ts.isIfStatement(n)) {
      found = n;
      return;
    }
    ts.forEachChild(n, visit);
  };
  visit(node);
  return found;
}

describe('resolveBindings', () => {
  it('returns a direct binding for a direct import', () => {
    const sourceFile = loadFixture('direct-import.ts');
    const table = resolveBindings(sourceFile);
    const binding = table.root.bindings.get('t');
    expect(binding).toBeDefined();
    expect(binding?.kind).toBe('direct');
    expect(binding?.localName).toBe('t');
  });

  it('returns a direct binding for an aliased import', () => {
    const sourceFile = loadFixture('aliased-import.ts');
    const table = resolveBindings(sourceFile);
    const binding = table.root.bindings.get('tr');
    expect(binding?.kind).toBe('direct');
    expect(binding?.localName).toBe('tr');
    expect(table.root.bindings.has('t')).toBe(false);
  });

  it('returns a namespace binding for a namespace import', () => {
    const sourceFile = loadFixture('namespace-import.ts');
    const table = resolveBindings(sourceFile);
    const binding = table.root.bindings.get('y');
    expect(binding?.kind).toBe('namespace');
    expect(binding?.localName).toBe('y');
  });

  it('returns a wrapper binding at root scope', () => {
    const sourceFile = loadFixture('wrapper.ts');
    const table = resolveBindings(sourceFile);
    expect(table.root.bindings.get('t')?.kind).toBe('direct');
    const wrapper = table.root.bindings.get('translate');
    expect(wrapper?.kind).toBe('wrapper');
    expect(wrapper?.localName).toBe('translate');
  });

  it('returns a nested wrapper binding scoped to its block', () => {
    const sourceFile = loadFixture('shadowed-wrapper.ts');
    const table = resolveBindings(sourceFile);

    expect(table.root.bindings.get('t')?.kind).toBe('direct');
    expect(table.root.bindings.has('translate')).toBe(false);

    const ifStmt = findFirstIfStatement(sourceFile);
    expect(ifStmt).toBeDefined();
    const thenBlock = ifStmt?.thenStatement;
    expect(thenBlock).toBeDefined();
    const innerCall = findFirstCallExpression(
      thenBlock as ts.Node,
      'translate',
    );
    expect(innerCall).toBeDefined();
    expect(table.find('translate', innerCall as ts.Node)?.kind).toBe('wrapper');

    expect(table.find('translate', sourceFile)).toBeUndefined();
  });

  it('returns the binding by walking up the scope chain', () => {
    const sourceFile = loadFixture('direct-import.ts');
    const table = resolveBindings(sourceFile);
    const call = findFirstCallExpression(sourceFile, 't');
    expect(call).toBeDefined();
    expect(table.find('t', call as ts.Node)?.kind).toBe('direct');
  });

  it('returns no binding for an import from a different module', () => {
    const sourceFile = parseSource("import { t } from 'other';");
    const table = resolveBindings(sourceFile);
    expect(table.root.bindings.size).toBe(0);
  });

  it('returns no binding for a side-effect import of `yapyak`', () => {
    const sourceFile = parseSource("import 'yapyak';");
    const table = resolveBindings(sourceFile);
    expect(table.root.bindings.size).toBe(0);
  });

  it('returns no binding for a default-only import of `yapyak`', () => {
    const sourceFile = parseSource("import t from 'yapyak';");
    const table = resolveBindings(sourceFile);
    expect(table.root.bindings.size).toBe(0);
  });

  it('returns no wrapper binding for a variable assigned an unknown identifier', () => {
    const sourceFile = parseSource(
      "import { t } from 'yapyak';\nconst translate = somethingUnknown;",
    );
    const table = resolveBindings(sourceFile);
    expect(table.root.bindings.has('translate')).toBe(false);
  });
});
