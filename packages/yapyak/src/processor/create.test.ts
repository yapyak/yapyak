import { describe, expect, it } from 'vitest';

import { createProcessor } from './create';
import { segmentsFromOffset } from './offset';

describe('createProcessor', () => {
  it('returns a processor carrying id and extensions', () => {
    const processor = createProcessor({
      extensions: [
        '.foo',
      ],
      id: 'foo',
    });

    expect(processor.id).toBe('foo');
    expect(processor.extensions).toEqual([
      '.foo',
    ]);
  });

  it('preserves the provided applyImport hook', () => {
    const calls: string[] = [];
    const processor = createProcessor({
      applyImport: (_, source, importStatement) => {
        calls.push(`${source}|${importStatement}`);
      },
      extensions: [
        '.foo',
      ],
      id: 'foo',
    });

    processor.applyImport?.(
      // biome-ignore lint/suspicious/noExplicitAny: yap yap yap
      {} as any,
      'source',
      "import { t } from 'yapyak';",
    );
    expect(calls).toEqual([
      "source|import { t } from 'yapyak';",
    ]);
  });

  it('preserves the provided parseSource hook', () => {
    const processor = createProcessor({
      extensions: [
        '.foo',
      ],
      id: 'foo',
      parseSource: (source) => ({
        fragments: [
          {
            code: source,
            language: 'ts',
            scope: 'module',
            segments: segmentsFromOffset(source, 0),
            type: 'script',
          },
        ],
      }),
    });

    const result = processor.parseSource?.('let x = 1;');
    expect(result).toEqual({
      fragments: [
        {
          code: 'let x = 1;',
          language: 'ts',
          scope: 'module',
          segments: segmentsFromOffset('let x = 1;', 0),
          type: 'script',
        },
      ],
    });
  });

  it('refuses construction when id is empty', () => {
    expect(() =>
      createProcessor({
        extensions: [
          '.foo',
        ],
        id: '',
      }),
    ).toThrow(/id must be a non-empty string/);
  });

  it('refuses construction when extensions is empty', () => {
    expect(() =>
      createProcessor({
        extensions: [],
        id: 'foo',
      }),
    ).toThrow(/extensions must be a non-empty array/);
  });
});
