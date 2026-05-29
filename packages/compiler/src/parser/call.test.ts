import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { resolveBindings } from './binding';
import { discoverCalls } from './call';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, 'fixture');

function loadFixture(category: string, name: string): ts.SourceFile {
  const source = readFileSync(join(ROOT, category, name), 'utf-8');
  const scriptKind = name.endsWith('.tsx')
    ? ts.ScriptKind.TSX
    : ts.ScriptKind.TS;
  return ts.createSourceFile(
    name,
    source,
    ts.ScriptTarget.ESNext,
    true,
    scriptKind,
  );
}

describe('discoverCalls', () => {
  it('returns direct `t` calls', () => {
    const sf = loadFixture('call', 'simple.ts');
    const calls = discoverCalls(sf, resolveBindings(sf));
    expect(calls).toHaveLength(2);
    for (const call of calls) {
      expect(call.binding.kind).toBe('direct');
    }
  });

  it('returns aliased calls', () => {
    const sf = loadFixture('binding', 'aliased-import.ts');
    const calls = discoverCalls(sf, resolveBindings(sf));
    expect(calls).toHaveLength(1);
    expect(calls[0]?.binding.localName).toBe('tr');
  });

  it('returns wrapper calls', () => {
    const sf = loadFixture('binding', 'wrapper.ts');
    const calls = discoverCalls(sf, resolveBindings(sf));
    expect(calls).toHaveLength(1);
    expect(calls[0]?.binding.kind).toBe('wrapper');
  });

  it('returns namespace member calls (`Y.t`)', () => {
    const sf = loadFixture('binding', 'namespace-import.ts');
    const calls = discoverCalls(sf, resolveBindings(sf));
    expect(calls).toHaveLength(1);
    expect(calls[0]?.binding.kind).toBe('namespace');
  });

  it('returns calls inside JSX', () => {
    const sf = loadFixture('call', 'nested-jsx.tsx');
    const calls = discoverCalls(sf, resolveBindings(sf));
    expect(calls).toHaveLength(3);
  });

  it('returns calls inside callbacks', () => {
    const sf = loadFixture('call', 'arrow-callback.ts');
    const calls = discoverCalls(sf, resolveBindings(sf));
    expect(calls).toHaveLength(1);
  });

  it('returns calls using a scope-local wrapper inside an `if` block', () => {
    const sf = loadFixture('binding', 'shadowed-wrapper.ts');
    const calls = discoverCalls(sf, resolveBindings(sf));
    expect(calls).toHaveLength(2);
    const kinds = calls.map((c) => c.binding.kind).sort();
    expect(kinds).toEqual(['direct', 'wrapper']);
  });

  it('captures the locale expression from an inline `t.in(...)` call', () => {
    const sf = loadFixture('call', 'scoped-inline.ts');
    const calls = discoverCalls(sf, resolveBindings(sf));
    expect(calls).toHaveLength(2);
    expect(calls[0]?.localeExpression?.getText()).toBe('previewLocale.value');
  });

  it('captures the locale expression from a scoped binding', () => {
    const sf = loadFixture('call', 'scoped-binding.ts');
    const calls = discoverCalls(sf, resolveBindings(sf));
    expect(calls).toHaveLength(2);
    for (const call of calls) {
      expect(call.localeExpression?.getText()).toBe("'sv'");
    }
  });

  it('returns ranges with line, column, and offset', () => {
    const sf = loadFixture('call', 'simple.ts');
    const calls = discoverCalls(sf, resolveBindings(sf));
    const first = calls[0];
    expect(first?.range.start.line).toBeGreaterThan(0);
    expect(first?.range.start.column).toBeGreaterThan(0);
    expect(first?.range.start.offset).toBeGreaterThanOrEqual(0);
    expect(first?.range.end.offset).toBeGreaterThan(
      first?.range.start.offset ?? 0,
    );
  });
});
