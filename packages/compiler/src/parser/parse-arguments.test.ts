import type { ParsedArguments } from './type';

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { discoverCalls } from './discover-calls';
import { parseArguments } from './parse-arguments';
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

function parseAll(category: string, name: string): ParsedArguments[] {
  const sf = loadFixture(category, name);
  const calls = discoverCalls(sf, resolveBindings(sf));
  return calls.map((call) => parseArguments(call));
}

describe('parseArguments', () => {
  it('parses simple literal', () => {
    const [parsed] = parseAll('calls', 'simple.ts');
    expect(parsed?.source).toBe('Hello');
    expect(parsed?.diagnostics).toHaveLength(0);
    expect(parsed?.params).toBeUndefined();
  });

  it('parses single placeholder with matching params', () => {
    const parsed = parseAll('calls', 'placeholders.ts');
    expect(parsed[0]?.source).toBe('Hi {name}');
    expect(parsed[0]?.params?.keys).toEqual(['name']);
    expect(parsed[0]?.params?.kind).toBe('static');
    expect(parsed[0]?.diagnostics).toHaveLength(0);
  });

  it('parses multiple placeholders', () => {
    const parsed = parseAll('calls', 'placeholders.ts');
    const summary = parsed[1];
    expect(summary?.source).toBe('Hi {name}, you have {count} messages');
    expect(summary?.params?.keys.sort()).toEqual(['count', 'name']);
    expect(summary?.diagnostics).toHaveLength(0);
  });

  it('emits YPK001 for dynamic source', () => {
    const [parsed] = parseAll('diagnostics', 'ypk001-dynamic-source.ts');
    expect(parsed?.diagnostics).toHaveLength(1);
    expect(parsed?.diagnostics[0]?.code).toBe('YPK001');
    expect(parsed?.diagnostics[0]?.severity).toBe('error');
  });

  it('emits YPK002 for missing param', () => {
    const [parsed] = parseAll('diagnostics', 'ypk002-missing-param.ts');
    const ypk002 = parsed?.diagnostics.filter((d) => d.code === 'YPK002');
    expect(ypk002).toHaveLength(1);
    expect(ypk002?.[0]?.message).toContain('name');
  });

  it('emits YPK003 for extra param', () => {
    const [parsed] = parseAll('diagnostics', 'ypk003-extra-param.ts');
    const ypk003 = parsed?.diagnostics.filter((d) => d.code === 'YPK003');
    expect(ypk003).toHaveLength(1);
    expect(ypk003?.[0]?.severity).toBe('warning');
    expect(ypk003?.[0]?.message).toContain('age');
  });

  it('emits YPK005 for spread params', () => {
    const [parsed] = parseAll('diagnostics', 'ypk005-spread-params.ts');
    expect(parsed?.params?.kind).toBe('spread');
    const ypk005 = parsed?.diagnostics.filter((d) => d.code === 'YPK005');
    expect(ypk005).toHaveLength(1);
    expect(ypk005?.[0]?.severity).toBe('warning');
  });

  it('emits YPK008 for empty source', () => {
    const [parsed] = parseAll('diagnostics', 'ypk008-empty-source.ts');
    const ypk008 = parsed?.diagnostics.filter((d) => d.code === 'YPK008');
    expect(ypk008).toHaveLength(1);
    expect(parsed?.source).toBe('');
  });

  it('preserves inline options object verbatim', () => {
    const parsed = parseAll('calls', 'dynamic-options.ts');
    expect(parsed[0]?.source).toBe('Hello');
    expect(parsed[0]?.optionsExpression).toBe(
      '{ locale: previewLocale.value }',
    );
    expect(parsed[0]?.diagnostics).toHaveLength(0);
  });

  it('preserves options reference verbatim', () => {
    const parsed = parseAll('calls', 'options-from-variable.ts');
    const farewell = parsed[1];
    expect(farewell?.source).toBe('Bye');
    expect(farewell?.optionsExpression).toBe('svOptions');
  });

  it('preserves options as third arg when source has placeholders', () => {
    const parsed = parseAll('calls', 'dynamic-options.ts');
    const farewell = parsed[1];
    expect(farewell?.source).toBe('Bye {name}');
    expect(farewell?.params?.keys).toEqual(['name']);
    expect(farewell?.optionsExpression).toBe('{ locale: previewLocale.value }');
  });

  it('extracts placeholder keys from plural blocks', () => {
    const [parsed] = parseAll('diagnostics', 'ypk007-invalid-plural.ts');
    expect(parsed?.source).toContain('plural');
    expect(parsed?.params?.keys).toEqual(['count']);
  });

  it('emits YPK007 for plural without other branch', () => {
    const [parsed] = parseAll('diagnostics', 'ypk007-invalid-plural.ts');
    const ypk007 = parsed?.diagnostics.filter((d) => d.code === 'YPK007');
    expect(ypk007).toHaveLength(1);
    expect(ypk007?.[0]?.severity).toBe('error');
    expect(ypk007?.[0]?.message).toContain('count');
  });

  it('treats no-substitution template literal as valid source', () => {
    const sf = ts.createSourceFile(
      'inline.ts',
      "import { $t } from '@yapyak/core';\nexport const x = $t(`Hello`);\n",
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );
    const calls = discoverCalls(sf, resolveBindings(sf));
    const parsed = parseArguments(calls[0]!);
    expect(parsed.source).toBe('Hello');
    expect(parsed.diagnostics).toHaveLength(0);
  });
});
