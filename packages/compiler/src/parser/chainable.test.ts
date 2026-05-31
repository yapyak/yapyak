import type { ParsedChainables } from './chainable';
import type { Diagnostic } from './diagnostic';

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { resolveBindings } from './binding';
import { discoverCalls } from './call';
import { detectOrphanChainables, parseChainables } from './chainable';

function parseInline(body: string): ParsedChainables {
  const sf = ts.createSourceFile(
    'inline.ts',
    `import { t } from 'yapyak';\n${body}\n`,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );
  const calls = discoverCalls(sf, resolveBindings(sf));
  // biome-ignore lint/style/noNonNullAssertion: yap yap yap
  return parseChainables(calls[0]!);
}

function detectInline(body: string): Diagnostic[] {
  const sf = ts.createSourceFile(
    'inline.ts',
    `import { t } from 'yapyak';\n${body}\n`,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );
  const bindings = resolveBindings(sf);
  const calls = discoverCalls(sf, bindings);
  const validTCalls = new Set(calls.map((call) => call.node));
  return detectOrphanChainables(sf, validTCalls);
}

describe('parseChainables', () => {
  it('returns no chainables for a plain `t()` call', () => {
    const result = parseInline("export const x = t('Save');");
    expect(result.tag).toBeUndefined();
    expect(result.hint).toBeUndefined();
    expect(result.maxLength).toBeUndefined();
    expect(result.diagnostics).toHaveLength(0);
  });

  it('parses `.tag()` as the tag value', () => {
    const result = parseInline("export const x = t('Open').tag('action');");
    expect(result.tag).toBe('action');
    expect(result.diagnostics).toHaveLength(0);
  });

  it('parses `.hint()` as the hint value', () => {
    const result = parseInline(
      "export const x = t('Save').hint('Form submit button');",
    );
    expect(result.hint).toBe('Form submit button');
    expect(result.diagnostics).toHaveLength(0);
  });

  it('parses `.maxLength()` as the maxLength value', () => {
    const result = parseInline("export const x = t('Save').maxLength(20);");
    expect(result.maxLength).toBe(20);
    expect(result.diagnostics).toHaveLength(0);
  });

  it('parses every chainable when all three are chained', () => {
    const result = parseInline(
      "export const x = t('Open').tag('action').hint('Primary').maxLength(12);",
    );
    expect(result.tag).toBe('action');
    expect(result.hint).toBe('Primary');
    expect(result.maxLength).toBe(12);
    expect(result.diagnostics).toHaveLength(0);
  });

  it('parses every chainable in any order', () => {
    const result = parseInline(
      "export const x = t('Open').maxLength(12).tag('action').hint('Primary');",
    );
    expect(result.tag).toBe('action');
    expect(result.hint).toBe('Primary');
    expect(result.maxLength).toBe(12);
  });

  it('emits YPK401 when `.tag()` argument is not a literal', () => {
    const result = parseInline("const t1 = 'x'; const x = t('Open').tag(t1);");
    const ypk401 = result.diagnostics.filter((d) => d.code === 'YPK401');
    expect(ypk401).toHaveLength(1);
    expect(result.tag).toBeUndefined();
  });

  it('emits YPK401 when `.maxLength()` argument is not an integer', () => {
    const result = parseInline("export const x = t('Save').maxLength(1.5);");
    const ypk401 = result.diagnostics.filter((d) => d.code === 'YPK401');
    expect(ypk401).toHaveLength(1);
    expect(result.maxLength).toBeUndefined();
  });

  it('emits YPK401 when `.maxLength()` argument is not positive', () => {
    const result = parseInline("export const x = t('Save').maxLength(0);");
    const ypk401 = result.diagnostics.filter((d) => d.code === 'YPK401');
    expect(ypk401).toHaveLength(1);
    expect(result.maxLength).toBeUndefined();
  });

  it('emits YPK402 when `.tag()` is called more than once', () => {
    const result = parseInline("export const x = t('Open').tag('a').tag('b');");
    const ypk402 = result.diagnostics.filter((d) => d.code === 'YPK402');
    expect(ypk402).toHaveLength(1);
    expect(result.tag).toBe('a');
  });
});

describe('detectOrphanChainables', () => {
  it('returns no diagnostics when `.tag()` follows `t()` directly', () => {
    expect(
      detectInline("export const x = t('Open').tag('action');"),
    ).toHaveLength(0);
  });

  it('returns no diagnostics for a chain of all three chainables', () => {
    expect(
      detectInline(
        "export const x = t('Open').tag('a').hint('h').maxLength(12);",
      ),
    ).toHaveLength(0);
  });

  it('emits YPK403 when `.tag()` is called on a bare identifier', () => {
    const diagnostics = detectInline(
      "const obj = { tag: (_: string) => '' };\nexport const x = obj.tag('action');",
    );
    expect(diagnostics.some((d) => d.code === 'YPK403')).toBe(true);
  });

  it('emits YPK403 when `.hint()` is called on a function-call result', () => {
    const diagnostics = detectInline(
      "function build() { return { hint: (_: string) => '' }; }\nexport const x = build().hint('greeting');",
    );
    expect(diagnostics.some((d) => d.code === 'YPK403')).toBe(true);
  });

  it('emits YPK403 when `.maxLength()` is called on a string literal', () => {
    const diagnostics = detectInline(
      "const o = { maxLength: (_: number) => '' };\nexport const x = o.maxLength(20);",
    );
    expect(diagnostics.some((d) => d.code === 'YPK403')).toBe(true);
  });
});
