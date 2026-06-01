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
    const { callSites } = discoverCalls(sf, resolveBindings(sf));
    expect(callSites).toHaveLength(2);
    for (const call of callSites) {
      expect(call.binding.kind).toBe('direct');
    }
  });

  it('returns aliased calls', () => {
    const sf = loadFixture('binding', 'aliased-import.ts');
    const { callSites } = discoverCalls(sf, resolveBindings(sf));
    expect(callSites).toHaveLength(1);
    expect(callSites[0]?.binding.localName).toBe('tr');
  });

  it('returns wrapper calls', () => {
    const sf = loadFixture('binding', 'wrapper.ts');
    const { callSites } = discoverCalls(sf, resolveBindings(sf));
    expect(callSites).toHaveLength(1);
    expect(callSites[0]?.binding.kind).toBe('wrapper');
  });

  it('returns namespace member calls (`Y.t`)', () => {
    const sf = loadFixture('binding', 'namespace-import.ts');
    const { callSites } = discoverCalls(sf, resolveBindings(sf));
    expect(callSites).toHaveLength(1);
    expect(callSites[0]?.binding.kind).toBe('namespace');
  });

  it('returns calls inside JSX', () => {
    const sf = loadFixture('call', 'nested-jsx.tsx');
    const { callSites } = discoverCalls(sf, resolveBindings(sf));
    expect(callSites).toHaveLength(3);
  });

  it('returns calls inside callbacks', () => {
    const sf = loadFixture('call', 'arrow-callback.ts');
    const { callSites } = discoverCalls(sf, resolveBindings(sf));
    expect(callSites).toHaveLength(1);
  });

  it('returns calls using a scope-local wrapper inside an `if` block', () => {
    const sf = loadFixture('binding', 'shadowed-wrapper.ts');
    const { callSites } = discoverCalls(sf, resolveBindings(sf));
    expect(callSites).toHaveLength(2);
    const kinds = callSites.map((c) => c.binding.kind).sort();
    expect(kinds).toEqual(['direct', 'wrapper']);
  });

  it('captures the locale expression from a direct `t.in(...)` call', () => {
    const sf = loadFixture('call', 'scoped-inline.ts');
    const { callSites } = discoverCalls(sf, resolveBindings(sf));
    expect(callSites).toHaveLength(2);
    expect(callSites[0]?.localeExpression?.getText()).toBe('previewLocale.value');
  });

  it('extracts a chained `t.in(loc).at(ctx, src)` call', () => {
    const sf = ts.createSourceFile(
      'inline.ts',
      "import { t } from 'yapyak';\nexport const x = t.in('sv').at('button', 'Open');\n",
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );
    const { callSites } = discoverCalls(sf, resolveBindings(sf));
    expect(callSites).toHaveLength(1);
    expect(callSites[0]?.localeExpression?.getText()).toBe("'sv'");
    expect(callSites[0]?.contextArg?.getText()).toBe("'button'");
    expect(callSites[0]?.sourceArg?.getText()).toBe("'Open'");
  });

  it('extracts a chained `t.at(ctx).in(loc, src)` call', () => {
    const sf = ts.createSourceFile(
      'inline.ts',
      "import { t } from 'yapyak';\nexport const x = t.at('button').in('sv', 'Open');\n",
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );
    const { callSites } = discoverCalls(sf, resolveBindings(sf));
    expect(callSites).toHaveLength(1);
    expect(callSites[0]?.localeExpression?.getText()).toBe("'sv'");
    expect(callSites[0]?.contextArg?.getText()).toBe("'button'");
    expect(callSites[0]?.sourceArg?.getText()).toBe("'Open'");
  });

  it('emits YPK405 when `t.in()` result is captured in a variable', () => {
    const sf = ts.createSourceFile(
      'inline.ts',
      "import { t } from 'yapyak';\nconst sv = t.in('sv');\n",
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );
    const { callSites, diagnostics } = discoverCalls(sf, resolveBindings(sf));
    expect(callSites).toHaveLength(0);
    expect(diagnostics.some((d) => d.code === 'YPK405')).toBe(true);
  });

  it('emits YPK405 when `t.at()` result is captured in a variable', () => {
    const sf = ts.createSourceFile(
      'inline.ts',
      "import { t } from 'yapyak';\nconst action = t.at('action');\n",
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );
    const { callSites, diagnostics } = discoverCalls(sf, resolveBindings(sf));
    expect(callSites).toHaveLength(0);
    expect(diagnostics.some((d) => d.code === 'YPK405')).toBe(true);
  });

  it('emits YPK405 when `t.in()` is returned from a function', () => {
    const sf = ts.createSourceFile(
      'inline.ts',
      "import { t } from 'yapyak';\nexport function scope() { return t.in('sv'); }\n",
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );
    const { diagnostics } = discoverCalls(sf, resolveBindings(sf));
    expect(diagnostics.some((d) => d.code === 'YPK405')).toBe(true);
  });

  it('emits YPK405 when `t.in()` is passed as an argument', () => {
    const sf = ts.createSourceFile(
      'inline.ts',
      "import { t } from 'yapyak';\ndeclare function use(x: unknown): void;\nuse(t.in('sv'));\n",
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );
    const { diagnostics } = discoverCalls(sf, resolveBindings(sf));
    expect(diagnostics.some((d) => d.code === 'YPK405')).toBe(true);
  });

  it('does not emit YPK405 when `t.in()` is followed inline by `.at(...)`', () => {
    const sf = ts.createSourceFile(
      'inline.ts',
      "import { t } from 'yapyak';\nexport const x = t.in('sv').at('button', 'Open');\n",
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );
    const { diagnostics } = discoverCalls(sf, resolveBindings(sf));
    expect(diagnostics).toHaveLength(0);
  });

  it('returns ranges with line, column, and offset', () => {
    const sf = loadFixture('call', 'simple.ts');
    const { callSites } = discoverCalls(sf, resolveBindings(sf));
    const first = callSites[0];
    expect(first?.range.start.line).toBeGreaterThan(0);
    expect(first?.range.start.column).toBeGreaterThan(0);
    expect(first?.range.start.offset).toBeGreaterThanOrEqual(0);
    expect(first?.range.end.offset).toBeGreaterThan(
      first?.range.start.offset ?? 0,
    );
  });
});
