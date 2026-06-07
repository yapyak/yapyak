import type { ExtractFileResult } from './extract';

import { describe, expect, it } from 'vitest';

import { extractFile } from './extract';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..', 'fixture');

function extractFixture(
  category: string,
  name: string,
  locales: string[] = ['en'],
): ExtractFileResult {
  const source = readFileSync(join(ROOT, category, name), 'utf-8');
  return extractFile({ fileId: name, locales, source });
}

describe('extractFile', () => {
  it('returns messages from direct import calls', () => {
    const result = extractFixture('call', 'simple.ts');
    expect(result.messages).toHaveLength(2);
    const sources = result.messages.map((m) => m.source).sort();
    expect(sources).toEqual(['Hello', 'Save']);
  });

  it('returns placeholders for messages with interpolation', () => {
    const result = extractFixture('call', 'placeholders.ts');
    expect(result.messages).toHaveLength(2);
    const greeting = result.messages.find((m) => m.source === 'Hi {name}');
    expect(greeting?.placeholders).toEqual([{ kind: 'simple', name: 'name' }]);
  });

  it('folds identical calls into one message with multiple locations', () => {
    const result = extractFile({
      fileId: 'multi.ts',
      locales: ['en'],
      source: `
        import { t } from 'yapyak';
        export const a = t('Hello');
        export const b = t('Hello');
      `,
    });
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]?.locations).toHaveLength(2);
  });

  it('returns call-site context per location', () => {
    const result = extractFixture('call', 'nested-jsx.tsx');
    expect(result.messages).toHaveLength(3);
    for (const message of result.messages) {
      expect(message.locations[0]?.callSiteContext.componentName).toBe(
        'Greeting',
      );
    }
  });

  it('returns stable ids across runs', () => {
    const first = extractFixture('call', 'simple.ts');
    const second = extractFixture('call', 'simple.ts');
    expect(first.messages.map((m) => m.id)).toEqual(
      second.messages.map((m) => m.id),
    );
  });

  it('returns every discovered call-site in `callSites` for transform reuse', () => {
    const result = extractFixture('call', 'nested-jsx.tsx');
    expect(result.callSites).toHaveLength(3);
  });

  it('parses `.tsx` fixtures with JSX', () => {
    const result = extractFixture('call', 'nested-jsx.tsx');
    expect(
      result.diagnostics.filter((d) => d.severity === 'error'),
    ).toHaveLength(0);
    expect(result.messages).toHaveLength(3);
  });

  describe('diagnostic', () => {
    it('returns no diagnostics for clean fixtures', () => {
      const result = extractFixture('call', 'simple.ts');
      expect(result.diagnostics).toHaveLength(0);
    });

    it('emits YPK102 from `parse-arguments`', () => {
      const result = extractFixture('diagnostic', 'ypk102-dynamic-source.ts');
      expect(result.diagnostics.some((d) => d.code === 'YPK102')).toBe(true);
    });

    it('emits YPK104 from `parse-arguments`', () => {
      const result = extractFixture('diagnostic', 'ypk104-missing-param.ts');
      expect(result.diagnostics.some((d) => d.code === 'YPK104')).toBe(true);
    });

    it('emits YPK202 from `parse-arguments`', () => {
      const result = extractFixture('diagnostic', 'ypk202-invalid-plural.ts');
      expect(result.diagnostics.some((d) => d.code === 'YPK202')).toBe(true);
    });
  });
});
