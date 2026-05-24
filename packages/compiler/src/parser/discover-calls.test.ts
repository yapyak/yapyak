import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { discoverCalls } from './discover-calls';
import { resolveBindings } from './resolve-bindings';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, 'fixtures');

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
  it('finds direct $t calls', () => {
    const sf = loadFixture('calls', 'simple.ts');
    const calls = discoverCalls(sf, resolveBindings(sf));
    expect(calls).toHaveLength(2);
    for (const call of calls) {
      expect(call.binding.kind).toBe('direct');
    }
  });

  it('finds aliased calls', () => {
    const sf = loadFixture('bindings', 'aliased-import.ts');
    const calls = discoverCalls(sf, resolveBindings(sf));
    expect(calls).toHaveLength(1);
    expect(calls[0]?.binding.localName).toBe('tr');
  });

  it('finds wrapper calls', () => {
    const sf = loadFixture('bindings', 'wrapper.ts');
    const calls = discoverCalls(sf, resolveBindings(sf));
    expect(calls).toHaveLength(1);
    expect(calls[0]?.binding.kind).toBe('wrapper');
  });

  it('finds factory calls', () => {
    const sf = loadFixture('bindings', 'factory-locale.ts');
    const calls = discoverCalls(sf, resolveBindings(sf));
    expect(calls).toHaveLength(1);
    expect(calls[0]?.binding.kind).toBe('factory');
    expect(calls[0]?.binding.factoryOptions).toEqual({ locale: 'sv' });
  });

  it('finds namespace member calls (Y.$t)', () => {
    const sf = loadFixture('bindings', 'namespace-import.ts');
    const calls = discoverCalls(sf, resolveBindings(sf));
    expect(calls).toHaveLength(1);
    expect(calls[0]?.binding.kind).toBe('namespace');
  });

  it('finds calls inside JSX', () => {
    const sf = loadFixture('calls', 'nested-jsx.tsx');
    const calls = discoverCalls(sf, resolveBindings(sf));
    expect(calls).toHaveLength(3);
  });

  it('finds calls inside callbacks', () => {
    const sf = loadFixture('calls', 'arrow-callback.ts');
    const calls = discoverCalls(sf, resolveBindings(sf));
    expect(calls).toHaveLength(1);
  });

  it('respects scope-local wrapper in if-block', () => {
    const sf = loadFixture('bindings', 'shadowed-wrapper.ts');
    const calls = discoverCalls(sf, resolveBindings(sf));
    expect(calls).toHaveLength(2);
    const kinds = calls.map((c) => c.binding.kind).sort();
    expect(kinds).toEqual(['direct', 'wrapper']);
  });

  it('records range with line/column/offset', () => {
    const sf = loadFixture('calls', 'simple.ts');
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
