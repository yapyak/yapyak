import type { ExtractFileResult } from './type';

import { describe, expect, it } from 'vitest';

import { extractFile } from './extract';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, 'fixtures');

function extractFixture(
  category: string,
  name: string,
  locales: readonly string[] = ['en'],
): ExtractFileResult {
  const source = readFileSync(join(ROOT, category, name), 'utf-8');
  return extractFile({ fileId: name, locales, source });
}

describe('extractFile', () => {
  describe('messages', () => {
    it('extracts simple messages from direct import', () => {
      const result = extractFixture('calls', 'simple.ts');
      expect(result.messages).toHaveLength(2);
      const sources = result.messages.map((m) => m.source).sort();
      expect(sources).toEqual(['Goodbye', 'Hello']);
    });

    it('extracts placeholders', () => {
      const result = extractFixture('calls', 'placeholders.ts');
      expect(result.messages).toHaveLength(2);
      const greeting = result.messages.find((m) => m.source === 'Hi {name}');
      expect(greeting?.placeholders).toEqual([
        { kind: 'simple', name: 'name' },
      ]);
    });

    it('attaches factoryLocale to location for factory calls', () => {
      const result = extractFixture('bindings', 'factory-locale.ts');
      const message = result.messages[0];
      expect(message?.locations[0]?.factoryLocale).toBe('sv');
    });

    it('dedupes identical calls into one message with multiple locations', () => {
      const result = extractFile({
        fileId: 'multi.ts',
        locales: ['en'],
        source: `
          import { $t } from '@yapyak/core';
          export const a = $t('Hello');
          export const b = $t('Hello');
        `,
      });
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]?.locations).toHaveLength(2);
    });

    it('treats different contexts as different messages', () => {
      const result = extractFixture(
        'diagnostics',
        'ypk009-duplicate-context.ts',
      );
      expect(result.messages).toHaveLength(2);
      const contexts = result.messages.map((m) => m.context).sort();
      expect(contexts).toEqual(['persist file', 'submit button']);
    });

    it('preserves call-site context per location', () => {
      const result = extractFixture('calls', 'nested-jsx.tsx');
      expect(result.messages).toHaveLength(3);
      for (const message of result.messages) {
        expect(message.locations[0]?.callSiteContext.componentName).toBe(
          'Greeting',
        );
      }
    });

    it('produces stable ids deterministically', () => {
      const first = extractFixture('calls', 'simple.ts');
      const second = extractFixture('calls', 'simple.ts');
      expect(first.messages.map((m) => m.id)).toEqual(
        second.messages.map((m) => m.id),
      );
    });
  });

  describe('diagnostics', () => {
    it('forwards YPK001 from parse-arguments', () => {
      const result = extractFixture('diagnostics', 'ypk001-dynamic-source.ts');
      expect(result.diagnostics.some((d) => d.code === 'YPK001')).toBe(true);
    });

    it('forwards YPK002 from parse-arguments', () => {
      const result = extractFixture('diagnostics', 'ypk002-missing-param.ts');
      expect(result.diagnostics.some((d) => d.code === 'YPK002')).toBe(true);
    });

    it('forwards YPK007 from parse-arguments', () => {
      const result = extractFixture('diagnostics', 'ypk007-invalid-plural.ts');
      expect(result.diagnostics.some((d) => d.code === 'YPK007')).toBe(true);
    });

    it('emits YPK004 for non-static factory option', () => {
      const result = extractFixture(
        'diagnostics',
        'ypk004-non-static-factory-option.ts',
      );
      const ypk004 = result.diagnostics.filter((d) => d.code === 'YPK004');
      expect(ypk004).toHaveLength(1);
      expect(ypk004[0]?.severity).toBe('error');
    });

    it('emits YPK010 for let-declared factory', () => {
      const result = extractFixture(
        'diagnostics',
        'ypk010-factory-not-const.ts',
      );
      const ypk010 = result.diagnostics.filter((d) => d.code === 'YPK010');
      expect(ypk010).toHaveLength(1);
      expect(ypk010[0]?.severity).toBe('error');
    });

    it('emits YPK011 for exported factory', () => {
      const result = extractFixture(
        'diagnostics',
        'ypk011-exported-factory.ts',
      );
      const ypk011 = result.diagnostics.filter((d) => d.code === 'YPK011');
      expect(ypk011).toHaveLength(1);
      expect(ypk011[0]?.severity).toBe('error');
    });

    it('emits YPK009 for duplicate-context source', () => {
      const result = extractFixture(
        'diagnostics',
        'ypk009-duplicate-context.ts',
      );
      const ypk009 = result.diagnostics.filter((d) => d.code === 'YPK009');
      expect(ypk009.length).toBeGreaterThanOrEqual(2);
      for (const diag of ypk009) {
        expect(diag.severity).toBe('warning');
      }
    });

    it('produces no diagnostics for clean fixtures', () => {
      const result = extractFixture('calls', 'simple.ts');
      expect(result.diagnostics).toHaveLength(0);
    });
  });

  describe('callSites returned', () => {
    it('includes every discovered call-site for transform reuse', () => {
      const result = extractFixture('calls', 'nested-jsx.tsx');
      expect(result.callSites).toHaveLength(3);
    });
  });

  describe('framework detection', () => {
    it('parses .tsx fixtures with JSX correctly', () => {
      const result = extractFixture('calls', 'nested-jsx.tsx');
      expect(
        result.diagnostics.filter((d) => d.severity === 'error'),
      ).toHaveLength(0);
      expect(result.messages).toHaveLength(3);
    });
  });
});
