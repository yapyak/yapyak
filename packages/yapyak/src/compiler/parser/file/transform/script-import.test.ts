import { describe, expect, it } from 'vitest';

import { extractFile } from '../extract';
import { transformFile } from '../transform';

function runTransform(input: { source: string; locales: string[] }): string {
  const fileId = 'src/a.tsx';
  const extracted = extractFile(fileId, input.source);
  return transformFile({
    extracted,
    fileId,
    locales: input.locales,
    source: input.source,
    translations: {},
  }).code;
}

describe('transformScriptImports', () => {
  it('elides a named import after its local is fully replaced', () => {
    const code = runTransform({
      locales: [
        'en',
      ],
      source: [
        "import { t } from 'yapyak';",
        "export const x = t('Hello');",
      ].join('\n'),
    });
    expect(code).not.toMatch(/import \{ t \}/);
  });

  it('elides a namespace import after the namespace local is fully replaced', () => {
    const code = runTransform({
      locales: [
        'en',
      ],
      source: [
        "import * as y from 'yapyak';",
        "export const x = y.t('Hello');",
      ].join('\n'),
    });
    expect(code).not.toMatch(/import \* as y/);
  });

  it('preserves a namespace import when the namespace local is still referenced', () => {
    const code = runTransform({
      locales: [
        'en',
      ],
      source: [
        "import * as y from 'yapyak';",
        "export const x = y.t('Hello');",
        'export const fallback = y.parseRichText;',
      ].join('\n'),
    });
    expect(code).toMatch(/import \* as y from ['"]yapyak['"]/);
  });

  it('preserves a `type` import alongside an elided runtime import', () => {
    const code = runTransform({
      locales: [
        'en',
      ],
      source: [
        "import { t, type TFn } from 'yapyak';",
        'export type Translator = TFn;',
        "export const x = t('Hello');",
      ].join('\n'),
    });
    expect(code).toMatch(/import \{ type TFn \}/);
  });

  it('preserves a type-only import declaration verbatim', () => {
    const code = runTransform({
      locales: [
        'en',
      ],
      source: [
        "import type { TFn } from 'yapyak';",
        'export type Translator = TFn;',
      ].join('\n'),
    });
    expect(code).toMatch(/import type \{ TFn \} from ['"]yapyak['"]/);
  });
});
