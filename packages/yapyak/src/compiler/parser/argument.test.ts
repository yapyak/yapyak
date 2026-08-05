import type { ParsedArguments } from './argument';

import ts from '@typescript/typescript6';
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
  const sourceFile = loadFixture(category, name);
  const { callSites } = discoverCalls(sourceFile, resolveBindings(sourceFile));
  return callSites.map((call) => parseArguments(call));
}

function parseInline(body: string): ParsedArguments {
  const sourceFile = ts.createSourceFile(
    'inline.ts',
    `import { t } from 'yapyak';\n${body}\n`,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );
  const { callSites } = discoverCalls(sourceFile, resolveBindings(sourceFile));
  // biome-ignore lint/style/noNonNullAssertion: yap yap yap
  return parseArguments(callSites[0]!);
}

describe('parseArguments', () => {
  it('parses a simple literal source', () => {
    const [parsed] = parseAll('call', 'simple.ts');
    expect(parsed?.source).toBe('Hello');
    expect(parsed?.diagnostics).toHaveLength(0);
    expect(parsed?.params).toBeUndefined();
  });

  it('parses a single placeholder with matching params', () => {
    const parsed = parseAll('call', 'placeholder.ts');
    expect(parsed[0]?.source).toBe('Hi {name}');
    expect(parsed[0]?.params?.keys).toEqual([
      'name',
    ]);
    expect(parsed[0]?.params?.kind).toBe('static');
    expect(parsed[0]?.diagnostics).toHaveLength(0);
  });

  it('parses multiple placeholders', () => {
    const parsed = parseAll('call', 'placeholder.ts');
    const summary = parsed[1];
    expect(summary?.source).toBe('Hi {name}, you have {count} messages');
    expect(summary?.params?.keys.sort()).toEqual([
      'count',
      'name',
    ]);
    expect(summary?.diagnostics).toHaveLength(0);
  });

  it('parses a no-substitution template literal as the source', () => {
    const parsed = parseInline('export const x = t(`Hello`);');
    expect(parsed.source).toBe('Hello');
    expect(parsed.diagnostics).toHaveLength(0);
  });

  it('parses placeholder keys from plural blocks', () => {
    const [parsed] = parseAll('diagnostic', 'yap0008-invalid-plural.ts');
    expect(parsed?.source).toContain('plural');
    expect(parsed?.params?.keys).toEqual([
      'count',
    ]);
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
    expect(farewell?.params?.keys).toEqual([
      'name',
    ]);
    expect(farewell?.diagnostics).toHaveLength(0);
  });

  describe('diagnostic', () => {
    it('emits YAP0001 when `t()` is called without arguments', () => {
      const parsed = parseInline('export const x = t();');
      expect(parsed.diagnostics).toHaveLength(1);
      expect(parsed.diagnostics[0]?.code).toBe('YAP0001');
      expect(parsed.diagnostics[0]?.severity).toBe('error');
    });

    it('emits YAP0002 for dynamic source', () => {
      const [parsed] = parseAll('diagnostic', 'yap0002-dynamic-source.ts');
      expect(parsed?.diagnostics).toHaveLength(1);
      expect(parsed?.diagnostics[0]?.code).toBe('YAP0002');
      expect(parsed?.diagnostics[0]?.severity).toBe('error');
    });

    it('emits YAP0003 for empty source', () => {
      const [parsed] = parseAll('diagnostic', 'yap0003-empty-source.ts');
      const yap0003 = parsed?.diagnostics.filter(
        (diagnostic) => diagnostic.code === 'YAP0003',
      );
      expect(yap0003).toHaveLength(1);
      expect(parsed?.source).toBe('');
    });

    it('emits YAP0004 for missing param', () => {
      const [parsed] = parseAll('diagnostic', 'yap0004-missing-param.ts');
      const yap0004 = parsed?.diagnostics.filter(
        (diagnostic) => diagnostic.code === 'YAP0004',
      );
      expect(yap0004).toHaveLength(1);
      expect(yap0004?.[0]?.message).toContain('name');
    });

    it('emits YAP0005 for extra param', () => {
      const [parsed] = parseAll('diagnostic', 'yap0005-extra-param.ts');
      const yap0005 = parsed?.diagnostics.filter(
        (diagnostic) => diagnostic.code === 'YAP0005',
      );
      expect(yap0005).toHaveLength(1);
      expect(yap0005?.[0]?.severity).toBe('warning');
      expect(yap0005?.[0]?.message).toContain('age');
    });

    it('emits YAP0006 for spread params', () => {
      const [parsed] = parseAll('diagnostic', 'yap0006-spread-param.ts');
      expect(parsed?.params?.kind).toBe('spread');
      const yap0006 = parsed?.diagnostics.filter(
        (diagnostic) => diagnostic.code === 'YAP0006',
      );
      expect(yap0006).toHaveLength(1);
      expect(yap0006?.[0]?.severity).toBe('warning');
    });

    it('emits YAP0006 for params passed as a variable', () => {
      const parsed = parseInline(
        "const props = { name: 'x' };\nexport const y = t('Hi {name}', props);",
      );
      expect(parsed.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
        'YAP0006',
      ]);
      expect(parsed.diagnostics[0]?.severity).toBe('warning');
    });

    it('emits no YAP0004 for params passed as a variable', () => {
      const parsed = parseInline(
        "const props = { name: 'x' };\nexport const y = t('Hi {name}', props);",
      );
      const yap0004 = parsed.diagnostics.filter(
        (diagnostic) => diagnostic.code === 'YAP0004',
      );
      expect(yap0004).toHaveLength(0);
    });

    it('emits YAP0007 for malformed ICU', () => {
      const parsed = parseInline("export const x = t('Hello {name');");
      const yap0007 = parsed.diagnostics.filter(
        (diagnostic) => diagnostic.code === 'YAP0007',
      );
      expect(yap0007).toHaveLength(1);
      expect(yap0007[0]?.severity).toBe('error');
    });

    it('emits YAP0008 for plural without other branch', () => {
      const [parsed] = parseAll('diagnostic', 'yap0008-invalid-plural.ts');
      const yap0008 = parsed?.diagnostics.filter(
        (diagnostic) => diagnostic.code === 'YAP0008',
      );
      expect(yap0008).toHaveLength(1);
      expect(yap0008?.[0]?.severity).toBe('error');
      expect(yap0008?.[0]?.message).toContain('count');
    });

    it('emits YAP0046 for an unknown plural keyword', () => {
      const parsed = parseInline(
        "export const x = t('{count, plural, oen {# item} other {# items}}', { count: 1 });",
      );
      const yap0046 = parsed.diagnostics.filter(
        (diagnostic) => diagnostic.code === 'YAP0046',
      );

      expect(yap0046).toHaveLength(1);
      expect(yap0046[0]?.severity).toBe('error');
      expect(yap0046[0]?.message).toContain('oen');
    });

    it('emits YAP0008 for select without other branch', () => {
      const parsed = parseInline(
        "export const x = t('{g, select, male {he}}', { g: 'male' });",
      );
      const yap0008 = parsed.diagnostics.filter(
        (diagnostic) => diagnostic.code === 'YAP0008',
      );
      expect(yap0008).toHaveLength(1);
      expect(yap0008[0]?.severity).toBe('error');
      expect(yap0008[0]?.message).toContain('g');
    });

    it('emits YAP0009 for an unsupported ICU feature', () => {
      const parsed = parseInline(
        "export const x = t('{n, number, ::currency/EUR}', { n: 1 });",
      );
      const yap0009 = parsed.diagnostics.filter(
        (diagnostic) => diagnostic.code === 'YAP0009',
      );
      expect(yap0009).toHaveLength(1);
      expect(yap0009[0]?.severity).toBe('error');
    });
  });

  describe('`t.as()` variant', () => {
    it('parses a literal context and source', () => {
      const parsed = parseInline("export const x = t.as('button', 'Save');");
      expect(parsed.context).toBe('button');
      expect(parsed.source).toBe('Save');
      expect(parsed.diagnostics).toHaveLength(0);
    });

    it('parses params from the third argument when source has placeholders', () => {
      const parsed = parseInline(
        "export const x = t.as('greeting', 'Hi {name}', { name: 'Alex' });",
      );
      expect(parsed.context).toBe('greeting');
      expect(parsed.source).toBe('Hi {name}');
      expect(parsed.params?.keys).toEqual([
        'name',
      ]);
      expect(parsed.diagnostics).toHaveLength(0);
    });

    it('emits YAP0017 when context is a non-literal expression', () => {
      const parsed = parseInline(
        "const ctx = 'button'; export const x = t.as(ctx, 'Save');",
      );
      const yap0017 = parsed.diagnostics.filter(
        (diagnostic) => diagnostic.code === 'YAP0017',
      );
      expect(yap0017).toHaveLength(1);
      expect(parsed.context).toBeUndefined();
    });

    it('holds kebab-case context names', () => {
      const parsed = parseInline(
        "export const x = t.as('primary-cta', 'Save');",
      );
      expect(parsed.context).toBe('primary-cta');
      expect(parsed.diagnostics).toHaveLength(0);
    });

    it('emits YAP0001 when called without arguments', () => {
      const parsed = parseInline('export const x = t.as();');
      const yap0001 = parsed.diagnostics.filter(
        (diagnostic) => diagnostic.code === 'YAP0001',
      );
      expect(yap0001).toHaveLength(1);
    });
  });
});
