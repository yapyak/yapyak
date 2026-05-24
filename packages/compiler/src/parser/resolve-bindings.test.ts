import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { resolveBindings } from './resolve-bindings';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const FIXTURES = join(import.meta.dirname, 'fixtures/bindings');

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

function findFirstCallExpression(
  node: ts.Node,
  name: string,
): ts.CallExpression | undefined {
  let found: ts.CallExpression | undefined;
  const visit = (n: ts.Node): void => {
    if (found !== undefined) return;
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
    if (found !== undefined) return;
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
  it('detects direct import', () => {
    const sf = loadFixture('direct-import.ts');
    const table = resolveBindings(sf);
    const binding = table.root.bindings.get('$t');
    expect(binding).toBeDefined();
    expect(binding?.kind).toBe('direct');
    expect(binding?.localName).toBe('$t');
  });

  it('detects aliased import', () => {
    const sf = loadFixture('aliased-import.ts');
    const table = resolveBindings(sf);
    const binding = table.root.bindings.get('tr');
    expect(binding?.kind).toBe('direct');
    expect(binding?.localName).toBe('tr');
    expect(table.root.bindings.has('$t')).toBe(false);
  });

  it('detects namespace import', () => {
    const sf = loadFixture('namespace-import.ts');
    const table = resolveBindings(sf);
    const binding = table.root.bindings.get('Y');
    expect(binding?.kind).toBe('namespace');
    expect(binding?.localName).toBe('Y');
  });

  it('detects wrapper at root scope', () => {
    const sf = loadFixture('wrapper.ts');
    const table = resolveBindings(sf);
    expect(table.root.bindings.get('$t')?.kind).toBe('direct');
    const wrapper = table.root.bindings.get('t');
    expect(wrapper?.kind).toBe('wrapper');
    expect(wrapper?.localName).toBe('t');
  });

  it('keeps nested wrapper local to its block', () => {
    const sf = loadFixture('shadowed-wrapper.ts');
    const table = resolveBindings(sf);

    expect(table.root.bindings.get('$t')?.kind).toBe('direct');
    expect(table.root.bindings.has('t')).toBe(false);

    const ifStmt = findFirstIfStatement(sf);
    expect(ifStmt).toBeDefined();
    const thenBlock = ifStmt?.thenStatement;
    expect(thenBlock).toBeDefined();
    const innerCall = findFirstCallExpression(thenBlock as ts.Node, 't');
    expect(innerCall).toBeDefined();
    expect(table.find('t', innerCall as ts.Node)?.kind).toBe('wrapper');

    expect(table.find('t', sf)).toBeUndefined();
  });

  it('find walks up through scope chain', () => {
    const sf = loadFixture('direct-import.ts');
    const table = resolveBindings(sf);
    const call = findFirstCallExpression(sf, '$t');
    expect(call).toBeDefined();
    expect(table.find('$t', call as ts.Node)?.kind).toBe('direct');
  });
});
