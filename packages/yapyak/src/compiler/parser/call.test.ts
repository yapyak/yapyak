import ts from '@typescript/typescript6';
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
    const sourceFile = loadFixture('call', 'simple.ts');
    const { callSites } = discoverCalls(
      sourceFile,
      resolveBindings(sourceFile),
    );
    expect(callSites).toHaveLength(2);
    for (const call of callSites) {
      expect(call.binding.kind).toBe('direct');
    }
  });

  it('returns aliased calls', () => {
    const sourceFile = loadFixture('binding', 'aliased-import.ts');
    const { callSites } = discoverCalls(
      sourceFile,
      resolveBindings(sourceFile),
    );
    expect(callSites).toHaveLength(1);
    expect(callSites[0]?.binding.localName).toBe('tr');
  });

  it('returns wrapper calls', () => {
    const sourceFile = loadFixture('binding', 'wrapper.ts');
    const { callSites } = discoverCalls(
      sourceFile,
      resolveBindings(sourceFile),
    );
    expect(callSites).toHaveLength(1);
    expect(callSites[0]?.binding.kind).toBe('wrapper');
  });

  it('returns namespace member calls (`y.t`)', () => {
    const sourceFile = loadFixture('binding', 'namespace-import.ts');
    const { callSites } = discoverCalls(
      sourceFile,
      resolveBindings(sourceFile),
    );
    expect(callSites).toHaveLength(1);
    expect(callSites[0]?.binding.kind).toBe('namespace');
  });

  it('returns calls inside JSX', () => {
    const sourceFile = loadFixture('call', 'nested-jsx.tsx');
    const { callSites } = discoverCalls(
      sourceFile,
      resolveBindings(sourceFile),
    );
    expect(callSites).toHaveLength(3);
  });

  it('returns calls inside callbacks', () => {
    const sourceFile = loadFixture('call', 'arrow-callback.ts');
    const { callSites } = discoverCalls(
      sourceFile,
      resolveBindings(sourceFile),
    );
    expect(callSites).toHaveLength(1);
  });

  it('returns calls using a scope-local wrapper inside an `if` block', () => {
    const sourceFile = loadFixture('binding', 'shadowed-wrapper.ts');
    const { callSites } = discoverCalls(
      sourceFile,
      resolveBindings(sourceFile),
    );
    expect(callSites).toHaveLength(2);
    const kinds = callSites.map((callSite) => callSite.binding.kind).sort();
    expect(kinds).toEqual([
      'direct',
      'wrapper',
    ]);
  });

  it('extracts the locale expression from a direct `t.in(...)` call', () => {
    const sourceFile = loadFixture('call', 'scoped-inline.ts');
    const { callSites } = discoverCalls(
      sourceFile,
      resolveBindings(sourceFile),
    );
    expect(callSites).toHaveLength(2);
    expect(callSites[0]?.localeExpression?.getText()).toBe(
      'previewLocale.value',
    );
  });

  it('extracts a chained `t.in(loc).as(ctx, src)` call', () => {
    const sourceFile = ts.createSourceFile(
      'inline.ts',
      "import { t } from 'yapyak';\nexport const x = t.in('sv').as('button', 'Save');\n",
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );
    const { callSites } = discoverCalls(
      sourceFile,
      resolveBindings(sourceFile),
    );
    expect(callSites).toHaveLength(1);
    expect(callSites[0]?.localeExpression?.getText()).toBe("'sv'");
    expect(callSites[0]?.contextExpression?.getText()).toBe("'button'");
    expect(callSites[0]?.sourceExpression?.getText()).toBe("'Save'");
  });

  it('extracts a chained `t.as(ctx).in(loc, src)` call', () => {
    const sourceFile = ts.createSourceFile(
      'inline.ts',
      "import { t } from 'yapyak';\nexport const x = t.as('button').in('sv', 'Save');\n",
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );
    const { callSites } = discoverCalls(
      sourceFile,
      resolveBindings(sourceFile),
    );
    expect(callSites).toHaveLength(1);
    expect(callSites[0]?.localeExpression?.getText()).toBe("'sv'");
    expect(callSites[0]?.contextExpression?.getText()).toBe("'button'");
    expect(callSites[0]?.sourceExpression?.getText()).toBe("'Save'");
  });

  it('emits YAP0020 when `t.in()` result is captured in a variable', () => {
    const sourceFile = ts.createSourceFile(
      'inline.ts',
      "import { t } from 'yapyak';\nconst sv = t.in('sv');\n",
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );
    const { callSites, diagnostics } = discoverCalls(
      sourceFile,
      resolveBindings(sourceFile),
    );
    expect(callSites).toHaveLength(0);
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'YAP0020'),
    ).toBe(true);
  });

  it('emits YAP0020 when `t.as()` result is captured in a variable', () => {
    const sourceFile = ts.createSourceFile(
      'inline.ts',
      "import { t } from 'yapyak';\nconst action = t.as('action');\n",
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );
    const { callSites, diagnostics } = discoverCalls(
      sourceFile,
      resolveBindings(sourceFile),
    );
    expect(callSites).toHaveLength(0);
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'YAP0020'),
    ).toBe(true);
  });

  it('emits YAP0020 when `t.in()` is returned from a function', () => {
    const sourceFile = ts.createSourceFile(
      'inline.ts',
      "import { t } from 'yapyak';\nexport function scope() { return t.in('sv'); }\n",
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );
    const { diagnostics } = discoverCalls(
      sourceFile,
      resolveBindings(sourceFile),
    );
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'YAP0020'),
    ).toBe(true);
  });

  it('emits YAP0020 when `t.in()` is passed as an argument', () => {
    const sourceFile = ts.createSourceFile(
      'inline.ts',
      "import { t } from 'yapyak';\ndeclare function use(x: unknown): void;\nuse(t.in('sv'));\n",
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );
    const { diagnostics } = discoverCalls(
      sourceFile,
      resolveBindings(sourceFile),
    );
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'YAP0020'),
    ).toBe(true);
  });

  it('emits no YAP0020 when `t.in()` is followed inline by `.as(...)`', () => {
    const sourceFile = ts.createSourceFile(
      'inline.ts',
      "import { t } from 'yapyak';\nexport const x = t.in('sv').as('button', 'Save');\n",
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );
    const { diagnostics } = discoverCalls(
      sourceFile,
      resolveBindings(sourceFile),
    );
    expect(diagnostics).toHaveLength(0);
  });

  it('extracts a direct `Y.t.in(loc, src)` namespace modifier call', () => {
    const sourceFile = ts.createSourceFile(
      'inline.ts',
      "import * as Y from 'yapyak';\nexport const x = Y.t.in('sv', 'Save');\n",
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );
    const { callSites } = discoverCalls(
      sourceFile,
      resolveBindings(sourceFile),
    );
    expect(callSites).toHaveLength(1);
    expect(callSites[0]?.localeExpression?.getText()).toBe("'sv'");
    expect(callSites[0]?.sourceExpression?.getText()).toBe("'Save'");
  });

  it('extracts a direct `Y.t.as(ctx, src)` namespace modifier call', () => {
    const sourceFile = ts.createSourceFile(
      'inline.ts',
      "import * as Y from 'yapyak';\nexport const x = Y.t.as('button', 'Save');\n",
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );
    const { callSites } = discoverCalls(
      sourceFile,
      resolveBindings(sourceFile),
    );
    expect(callSites).toHaveLength(1);
    expect(callSites[0]?.contextExpression?.getText()).toBe("'button'");
    expect(callSites[0]?.sourceExpression?.getText()).toBe("'Save'");
  });

  it('extracts a chained `Y.t.in(loc).as(ctx, src)` namespace call', () => {
    const sourceFile = ts.createSourceFile(
      'inline.ts',
      "import * as Y from 'yapyak';\nexport const x = Y.t.in('sv').as('button', 'Save');\n",
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );
    const { callSites } = discoverCalls(
      sourceFile,
      resolveBindings(sourceFile),
    );
    expect(callSites).toHaveLength(1);
    expect(callSites[0]?.localeExpression?.getText()).toBe("'sv'");
    expect(callSites[0]?.contextExpression?.getText()).toBe("'button'");
  });

  it('emits YAP0020 when `Y.t.in()` result is captured in a variable', () => {
    const sourceFile = ts.createSourceFile(
      'inline.ts',
      "import * as Y from 'yapyak';\nconst sv = Y.t.in('sv');\n",
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );
    const { callSites, diagnostics } = discoverCalls(
      sourceFile,
      resolveBindings(sourceFile),
    );
    expect(callSites).toHaveLength(0);
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'YAP0020'),
    ).toBe(true);
  });

  it('returns no call sites for a non-`in`/`as` method on `t`', () => {
    const sourceFile = ts.createSourceFile(
      'inline.ts',
      "import { t } from 'yapyak';\nexport const x = (t as { foo: () => string }).foo();\n",
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );
    const { callSites } = discoverCalls(
      sourceFile,
      resolveBindings(sourceFile),
    );
    expect(callSites).toHaveLength(0);
  });

  it('returns no call sites for a chain where inner method matches outer', () => {
    const sourceFile = ts.createSourceFile(
      'inline.ts',
      "import { t } from 'yapyak';\nexport const x = t.in('sv').in('en', 'Save');\n",
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );
    const { callSites } = discoverCalls(
      sourceFile,
      resolveBindings(sourceFile),
    );
    expect(callSites).toHaveLength(0);
  });

  it('returns only the inner call when an outer chain has an inner with multiple args', () => {
    const sourceFile = ts.createSourceFile(
      'inline.ts',
      "import { t } from 'yapyak';\nexport const x = t.in('sv', 'extra').as('button', 'Save');\n",
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );
    const { callSites } = discoverCalls(
      sourceFile,
      resolveBindings(sourceFile),
    );
    expect(callSites).toHaveLength(1);
    expect(callSites[0]?.localeExpression?.getText()).toBe("'sv'");
    expect(callSites[0]?.sourceExpression?.getText()).toBe("'extra'");
  });

  it('returns no call sites for a chain on an unknown receiver', () => {
    const sourceFile = ts.createSourceFile(
      'inline.ts',
      "export const x = unknown.in('sv').as('button', 'Save');\n",
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );
    const { callSites } = discoverCalls(
      sourceFile,
      resolveBindings(sourceFile),
    );
    expect(callSites).toHaveLength(0);
  });

  it('returns ranges with line, column, and offset', () => {
    const sourceFile = loadFixture('call', 'simple.ts');
    const { callSites } = discoverCalls(
      sourceFile,
      resolveBindings(sourceFile),
    );
    const first = callSites[0];
    expect(first?.range.start.line).toBeGreaterThan(0);
    expect(first?.range.start.column).toBeGreaterThan(0);
    expect(first?.range.start.offset).toBeGreaterThanOrEqual(0);
    expect(first?.range.end.offset).toBeGreaterThan(
      first?.range.start.offset ?? 0,
    );
  });
});
