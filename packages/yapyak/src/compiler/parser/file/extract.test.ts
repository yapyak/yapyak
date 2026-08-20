import type { Processor } from '../../../processor';
import type { ExtractFileResult } from './extract';

import { describe, expect, it } from 'vitest';

import { rangeFromOffsets, segmentsFromOffset } from '../../../processor';
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
    const result = extractFixture('call', 'placeholder.ts');
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
      expect(message.locations[0]?.callSiteContext.enclosingComponent).toBe(
        'Greeting',
      );
    }
  });

  it('merges the fragment element with the component from the `fileId`', () => {
    const processor: Processor = {
      extensions: [
        '.vue',
      ],
      id: 'template',
      parseSource: () => ({
        fragments: [
          {
            code: "import { t } from 'yapyak';",
            language: 'ts',
            segments: segmentsFromOffset("import { t } from 'yapyak';", 0),
            type: 'script',
          },
          {
            code: "t('Save changes')",
            enclosingAttribute: 'aria-label',
            enclosingElement: 'button',
            language: 'ts',
            segments: segmentsFromOffset("t('Save changes')", 28),
            snippet: `<button>{t('Save changes')}</button>`,
            type: 'template-expression',
          },
        ],
      }),
    };
    const result = extractFile(
      'src/a.vue',
      "import { t } from 'yapyak'; t('Save changes')",
      {
        processors: [
          processor,
        ],
      },
    );
    expect(result.messages[0]?.locations[0]?.callSiteContext).toEqual({
      enclosingAttribute: 'aria-label',
      enclosingComponent: 'A',
      enclosingElement: 'button',
      snippet: `<button>{t('Save changes')}</button>`,
    });
  });

  it('records a `YAP0048` diagnostic from the processor', () => {
    const source = "import { t } from 'yapyak';";
    const processor: Processor = {
      extensions: [
        '.vue',
      ],
      id: 'template',
      parseSource: () => ({
        diagnostics: [
          {
            message: 'Unexpected token',
            range: rangeFromOffsets(source, 0, 6),
          },
        ],
        fragments: [
          {
            code: source,
            language: 'ts',
            segments: segmentsFromOffset(source, 0),
            type: 'script',
          },
        ],
      }),
    };
    const result = extractFile('src/a.vue', source, {
      processors: [
        processor,
      ],
    });

    expect(result.diagnostics[0]?.code).toBe('YAP0048');
    expect(result.diagnostics[0]?.severity).toBe('error');
    expect(result.diagnostics[0]?.message).toContain('Unexpected token');
  });

  it('refuses a fragment whose segments do not cover the code', () => {
    const source = "import { t } from 'yapyak';";
    const processor: Processor = {
      extensions: [
        '.vue',
      ],
      id: 'template',
      parseSource: () => ({
        fragments: [
          {
            code: source,
            language: 'ts',
            segments: [
              {
                codeLength: 5,
                sourceOffset: 0,
              },
            ],
            type: 'script',
          },
        ],
      }),
    };

    expect(() =>
      extractFile('src/a.vue', source, {
        processors: [
          processor,
        ],
      }),
    ).toThrow('Processor "template"');
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

  it('normalizes every context string to Unicode NFC', () => {
    const nonNfc = 'café';
    const nfc = 'café';
    const code = `import { t } from 'yapyak';\nt.as('${nonNfc}', 'Open');\n`;
    const result = extractFile('src/a.ts', code);
    expect(result.messages[0]?.context).toBe(nfc);
  });

  describe('diagnostic', () => {
    it('returns no diagnostics for clean fixtures', () => {
      const result = extractFixture('call', 'simple.ts');
      expect(result.diagnostics).toHaveLength(0);
    });

    it('emits YAP0002 from `parse-arguments`', () => {
      const result = extractFixture('diagnostic', 'yap0002-dynamic-source.ts');
      expect(
        result.diagnostics.some((diagnostic) => diagnostic.code === 'YAP0002'),
      ).toBe(true);
    });

    it('emits YAP0004 from `parse-arguments`', () => {
      const result = extractFixture('diagnostic', 'yap0004-missing-param.ts');
      expect(
        result.diagnostics.some((diagnostic) => diagnostic.code === 'YAP0004'),
      ).toBe(true);
    });

    it('emits YAP0008 from `parse-arguments`', () => {
      const result = extractFixture('diagnostic', 'yap0008-invalid-plural.ts');
      expect(
        result.diagnostics.some((diagnostic) => diagnostic.code === 'YAP0008'),
      ).toBe(true);
    });
  });
});
