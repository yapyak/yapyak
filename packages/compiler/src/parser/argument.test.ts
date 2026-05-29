import type { ParsedArguments } from './argument';

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { parseArguments } from './argument';
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

function parseAll(category: string, name: string): ParsedArguments[] {
  const sf = loadFixture(category, name);
  const calls = discoverCalls(sf, resolveBindings(sf));
  return calls.map((call) => parseArguments(call));
}

function parseInline(body: string): ParsedArguments {
  const sf = ts.createSourceFile(
    'inline.ts',
    `import { t } from 'yapyak';\n${body}\n`,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );
  const calls = discoverCalls(sf, resolveBindings(sf));
  // biome-ignore lint/style/noNonNullAssertion: yap yap yap
  return parseArguments(calls[0]!);
}

describe('parseArguments', () => {
  it('parses a simple literal source', () => {
    const [parsed] = parseAll('call', 'simple.ts');
    expect(parsed?.source).toBe('Hello');
    expect(parsed?.diagnostics).toHaveLength(0);
    expect(parsed?.params).toBeUndefined();
  });

  it('parses a single placeholder with matching params', () => {
    const parsed = parseAll('call', 'placeholders.ts');
    expect(parsed[0]?.source).toBe('Hi {name}');
    expect(parsed[0]?.params?.keys).toEqual(['name']);
    expect(parsed[0]?.params?.kind).toBe('static');
    expect(parsed[0]?.diagnostics).toHaveLength(0);
  });

  it('parses multiple placeholders', () => {
    const parsed = parseAll('call', 'placeholders.ts');
    const summary = parsed[1];
    expect(summary?.source).toBe('Hi {name}, you have {count} messages');
    expect(summary?.params?.keys.sort()).toEqual(['count', 'name']);
    expect(summary?.diagnostics).toHaveLength(0);
  });

  it('parses a no-substitution template literal as the source', () => {
    const parsed = parseInline('export const x = t(`Hello`);');
    expect(parsed.source).toBe('Hello');
    expect(parsed.diagnostics).toHaveLength(0);
  });

  it('parses placeholder keys from plural blocks', () => {
    const [parsed] = parseAll('diagnostic', 'ypk007-invalid-plural.ts');
    expect(parsed?.source).toContain('plural');
    expect(parsed?.params?.keys).toEqual(['count']);
  });

  it('parses the source from an inline `t.in(...)` call', () => {
    const [parsed] = parseAll('call', 'scoped-inline.ts');
    expect(parsed?.source).toBe('Hello');
    expect(parsed?.diagnostics).toHaveLength(0);
  });

  it('parses params from a scoped call with placeholders', () => {
    const parsed = parseAll('call', 'scoped-inline.ts');
    const farewell = parsed[1];
    expect(farewell?.source).toBe('Bye {name}');
    expect(farewell?.params?.keys).toEqual(['name']);
    expect(farewell?.diagnostics).toHaveLength(0);
  });

  describe('diagnostic', () => {
    it('emits YPK001 for dynamic source', () => {
      const [parsed] = parseAll('diagnostic', 'ypk001-dynamic-source.ts');
      expect(parsed?.diagnostics).toHaveLength(1);
      expect(parsed?.diagnostics[0]?.code).toBe('YPK001');
      expect(parsed?.diagnostics[0]?.severity).toBe('error');
    });

    it('emits YPK001 when `t()` is called without arguments', () => {
      const parsed = parseInline('export const x = t();');
      expect(parsed.diagnostics).toHaveLength(1);
      expect(parsed.diagnostics[0]?.code).toBe('YPK001');
      expect(parsed.diagnostics[0]?.severity).toBe('error');
    });

    it('emits YPK002 for missing param', () => {
      const [parsed] = parseAll('diagnostic', 'ypk002-missing-param.ts');
      const ypk002 = parsed?.diagnostics.filter((d) => d.code === 'YPK002');
      expect(ypk002).toHaveLength(1);
      expect(ypk002?.[0]?.message).toContain('name');
    });

    it('emits YPK003 for extra param', () => {
      const [parsed] = parseAll('diagnostic', 'ypk003-extra-param.ts');
      const ypk003 = parsed?.diagnostics.filter((d) => d.code === 'YPK003');
      expect(ypk003).toHaveLength(1);
      expect(ypk003?.[0]?.severity).toBe('warning');
      expect(ypk003?.[0]?.message).toContain('age');
    });

    it('emits YPK005 for spread params', () => {
      const [parsed] = parseAll('diagnostic', 'ypk005-spread-params.ts');
      expect(parsed?.params?.kind).toBe('spread');
      const ypk005 = parsed?.diagnostics.filter((d) => d.code === 'YPK005');
      expect(ypk005).toHaveLength(1);
      expect(ypk005?.[0]?.severity).toBe('warning');
    });

    it('emits YPK005 for params passed as a variable', () => {
      const parsed = parseInline(
        "const props = { name: 'x' };\nexport const y = t('Hi {name}', props);",
      );
      expect(parsed.diagnostics.map((d) => d.code)).toEqual(['YPK005']);
      expect(parsed.diagnostics[0]?.severity).toBe('warning');
    });

    it('emits no YPK002 for params passed as a variable', () => {
      const parsed = parseInline(
        "const props = { name: 'x' };\nexport const y = t('Hi {name}', props);",
      );
      const ypk002 = parsed.diagnostics.filter((d) => d.code === 'YPK002');
      expect(ypk002).toHaveLength(0);
    });

    it('emits YPK007 for plural without other branch', () => {
      const [parsed] = parseAll('diagnostic', 'ypk007-invalid-plural.ts');
      const ypk007 = parsed?.diagnostics.filter((d) => d.code === 'YPK007');
      expect(ypk007).toHaveLength(1);
      expect(ypk007?.[0]?.severity).toBe('error');
      expect(ypk007?.[0]?.message).toContain('count');
    });

    it('emits YPK007 for select without other branch', () => {
      const parsed = parseInline(
        "export const x = t('{g, select, male {he}}', { g: 'male' });",
      );
      const ypk007 = parsed.diagnostics.filter((d) => d.code === 'YPK007');
      expect(ypk007).toHaveLength(1);
      expect(ypk007[0]?.severity).toBe('error');
      expect(ypk007[0]?.message).toContain('g');
    });

    it('emits YPK008 for empty source', () => {
      const [parsed] = parseAll('diagnostic', 'ypk008-empty-source.ts');
      const ypk008 = parsed?.diagnostics.filter((d) => d.code === 'YPK008');
      expect(ypk008).toHaveLength(1);
      expect(parsed?.source).toBe('');
    });

    it('emits YPK009 for malformed ICU', () => {
      const parsed = parseInline("export const x = t('Hello {name');");
      const ypk009 = parsed.diagnostics.filter((d) => d.code === 'YPK009');
      expect(ypk009).toHaveLength(1);
      expect(ypk009[0]?.severity).toBe('error');
    });

    it('emits YPK010 for an unsupported ICU feature', () => {
      const parsed = parseInline(
        "export const x = t('{n, number, ::currency/EUR}', { n: 1 });",
      );
      const ypk010 = parsed.diagnostics.filter((d) => d.code === 'YPK010');
      expect(ypk010).toHaveLength(1);
      expect(ypk010[0]?.severity).toBe('error');
    });
  });
});
