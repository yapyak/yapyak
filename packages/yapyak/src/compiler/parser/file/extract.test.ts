import type { ExtractFileResult } from './extract';

import { describe, expect, it } from 'vitest';

import { extractFile } from './extract';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..', 'fixture');

function extractFixture(category: string, name: string): ExtractFileResult {
  const source = readFileSync(join(ROOT, category, name), 'utf-8');
  return extractFile(name, source);
}

describe('extractFile', () => {
  it('returns messages from direct import calls', () => {
    const result = extractFixture('call', 'simple.ts');
    expect(result.messages).toHaveLength(2);
    const sources = result.messages.map((message) => message.source).sort();
    expect(sources).toEqual([
      'Hello',
      'Save',
    ]);
  });

  it('returns placeholders for messages with interpolation', () => {
    const result = extractFixture('call', 'placeholders.ts');
    expect(result.messages).toHaveLength(2);
    const greeting = result.messages.find(
      (message) => message.source === 'Hi {name}',
    );
    expect(greeting?.placeholders).toEqual([
      {
        kind: 'simple',
        name: 'name',
      },
    ]);
  });

  it('folds identical calls into one message with multiple locations', () => {
    const result = extractFile(
      'multi.ts',
      `
        import { t } from 'yapyak';
        export const a = t('Hello');
        export const b = t('Hello');
      `,
    );
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
    expect(first.messages.map((message) => message.id)).toEqual(
      second.messages.map((message) => message.id),
    );
  });

  it('returns every discovered call-site in `callSites` for transform reuse', () => {
    const result = extractFixture('call', 'nested-jsx.tsx');
    expect(result.callSites).toHaveLength(3);
  });

  it('parses `.tsx` fixtures with JSX', () => {
    const result = extractFixture('call', 'nested-jsx.tsx');
    expect(
      result.diagnostics.filter(
        (diagnostic) => diagnostic.severity === 'error',
      ),
    ).toHaveLength(0);
    expect(result.messages).toHaveLength(3);
  });

  it('normalizes every source string to Unicode NFC', () => {
    const nonNfc = 'café';
    const nfc = 'café';
    const code = `import { t } from 'yapyak';\nt('${nonNfc}');\n`;
    const result = extractFile('src/a.ts', code);
    expect(result.messages[0]?.source).toBe(nfc);
  });

  describe('diagnostic', () => {
    it('returns no diagnostics for clean fixtures', () => {
      const result = extractFixture('call', 'simple.ts');
      expect(result.diagnostics).toHaveLength(0);
    });

    it('emits YAP0002 from `parse-arguments`', () => {
      const result = extractFixture('diagnostic', 'ypk102-dynamic-source.ts');
      expect(
        result.diagnostics.some((diagnostic) => diagnostic.code === 'YAP0002'),
      ).toBe(true);
    });

    it('emits YAP0004 from `parse-arguments`', () => {
      const result = extractFixture('diagnostic', 'ypk104-missing-param.ts');
      expect(
        result.diagnostics.some((diagnostic) => diagnostic.code === 'YAP0004'),
      ).toBe(true);
    });

    it('emits YAP0008 from `parse-arguments`', () => {
      const result = extractFixture('diagnostic', 'ypk202-invalid-plural.ts');
      expect(
        result.diagnostics.some((diagnostic) => diagnostic.code === 'YAP0008'),
      ).toBe(true);
    });
  });
});
