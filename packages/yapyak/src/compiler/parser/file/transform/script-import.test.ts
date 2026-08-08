import MagicString from 'magic-string';
import { describe, expect, it } from 'vitest';

import { segmentsFromOffset } from '../../../../processor';
import { extractFile } from '../extract';
import { transformFile } from '../transform';
import { transformScriptImports } from './script-import';

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

function runScriptImports(source: string): string {
  const magicString = new MagicString(source);
  transformScriptImports({
    fileId: 'src/a.tsx',
    fragments: [
      {
        code: source,
        language: 'ts',
        segments: segmentsFromOffset(source, 0),
        type: 'script',
      },
    ],
    magicString,
    originalSource: source,
  });
  return magicString.toString();
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

  it('preserves a default import declaration', () => {
    const source = "import y from 'yapyak';\nexport const x = y;";
    expect(runScriptImports(source)).toBe(source);
  });

  it('preserves an aliased named import when the local is still referenced', () => {
    const source =
      "import { t as translate } from 'yapyak';\nexport const x = translate;";
    expect(runScriptImports(source)).toBe(source);
  });

  it('preserves a named import when the local is an object literal value', () => {
    const source =
      "import { t } from 'yapyak';\nexport const x = { label: t };";
    expect(runScriptImports(source)).toBe(source);
  });

  it('elides a named import when the local appears only in a property access', () => {
    const source = "import { t } from 'yapyak';\nexport const x = window.t;";
    expect(runScriptImports(source)).toBe('\nexport const x = window.t;');
  });

  it('elides a named import when the local appears only as an object literal key', () => {
    const source = "import { t } from 'yapyak';\nexport const x = { t: 1 };";
    expect(runScriptImports(source)).toBe('\nexport const x = { t: 1 };');
  });

  it('elides a named import when the local appears only as a JSX attribute name', () => {
    const source =
      'import { t } from \'yapyak\';\nexport const x = <div t="1" />;';
    expect(runScriptImports(source)).toBe('\nexport const x = <div t="1" />;');
  });

  it('skips an import whose module specifier is not a string literal', () => {
    const source = 'import { t } from yapyak;';
    expect(runScriptImports(source)).toBe(source);
  });

  it('preserves a named import when the local appears outside every fragment', () => {
    const script = "import { t } from 'yapyak';\n";
    const source = `${script}{t('Hello')}\n`;
    const magicString = new MagicString(source);
    transformScriptImports({
      fileId: 'src/a.tsx',
      fragments: [
        {
          code: script,
          language: 'ts',
          segments: segmentsFromOffset(script, 0),
          type: 'script',
        },
      ],
      magicString,
      originalSource: source,
    });

    expect(magicString.toString()).toContain("import { t } from 'yapyak';");
  });

  it('preserves a namespace import when the namespace local appears outside every fragment', () => {
    const script = "import * as yapyak from 'yapyak';\n";
    const source = `${script}{yapyak.t('Hello')}\n`;
    const magicString = new MagicString(source);
    transformScriptImports({
      fileId: 'src/a.tsx',
      fragments: [
        {
          code: script,
          language: 'ts',
          segments: segmentsFromOffset(script, 0),
          type: 'script',
        },
      ],
      magicString,
      originalSource: source,
    });

    expect(magicString.toString()).toContain(
      "import * as yapyak from 'yapyak';",
    );
  });

  it('preserves a named import when overlapping fragments hold a call-shaped string', () => {
    const declaration = "import { t } from 'yapyak';\n";
    const outer = "x = ['call t( now'];\n";
    const inner = "'call t( now'";
    const source = `${declaration}${outer}t('left')\n`;
    const magicString = new MagicString(source);
    transformScriptImports({
      fileId: 'src/a.tsx',
      fragments: [
        {
          code: declaration,
          language: 'ts',
          segments: segmentsFromOffset(declaration, 0),
          type: 'script',
        },
        {
          code: outer,
          language: 'ts',
          segments: segmentsFromOffset(outer, declaration.length),
          type: 'template-expression',
        },
        {
          code: inner,
          language: 'ts',
          segments: segmentsFromOffset(inner, source.indexOf(inner)),
          type: 'template-expression',
        },
      ],
      magicString,
      originalSource: source,
    });

    expect(magicString.toString()).toContain("import { t } from 'yapyak';");
  });

  it('skips a `template-expression` fragment', () => {
    const source = "import { t } from 'yapyak';";
    const magicString = new MagicString(source);
    transformScriptImports({
      fileId: 'src/a.tsx',
      fragments: [
        {
          code: source,
          language: 'ts',
          segments: segmentsFromOffset(source, 0),
          type: 'template-expression',
        },
      ],
      magicString,
      originalSource: source,
    });
    expect(magicString.toString()).toBe(source);
  });

  it('elides a named import when another fragment only default-imports the same name', () => {
    const first = "import { t } from 'yapyak';\n";
    const second = "import t from './helper';\n";
    const magicString = new MagicString(first + second);
    transformScriptImports({
      fileId: 'src/a.tsx',
      fragments: [
        {
          code: first,
          language: 'ts',
          segments: segmentsFromOffset(first, 0),
          type: 'script',
        },
        {
          code: second,
          language: 'ts',
          segments: segmentsFromOffset(second, first.length),
          type: 'script',
        },
      ],
      magicString,
      originalSource: first + second,
    });
    expect(magicString.toString()).toBe(`\n${second}`);
  });

  it('elides a named import when the referencing region was already removed', () => {
    const importLine = "import { t } from 'yapyak';\n";
    const usage = 'export const x = t;';
    const source = importLine + usage;
    const magicString = new MagicString(source);
    magicString.remove(importLine.length - 1, source.length);
    transformScriptImports({
      fileId: 'src/a.tsx',
      fragments: [
        {
          code: importLine,
          language: 'ts',
          segments: segmentsFromOffset(importLine, 0),
          type: 'script',
        },
        {
          code: usage,
          language: 'ts',
          segments: segmentsFromOffset(usage, importLine.length),
          type: 'script',
        },
      ],
      magicString,
      originalSource: source,
    });
    expect(magicString.toString()).toBe('');
  });
});
