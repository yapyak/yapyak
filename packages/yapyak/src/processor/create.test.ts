import { describe, expect, it } from 'vitest';

import { createProcessor } from './create';

describe('createProcessor', () => {
  it('returns a processor carrying id and extensions', () => {
    const processor = createProcessor({
      applyImport: () => {},
      extensions: ['.foo'],
      id: 'foo',
      parseFragments: () => [],
    });

    expect(processor.id).toBe('foo');
    expect(processor.extensions).toEqual(['.foo']);
  });

  it('forwards calls to the provided applyImport hook', () => {
    const calls: string[] = [];
    const processor = createProcessor({
      applyImport: (_, source, importStatement) => {
        calls.push(`${source}|${importStatement}`);
      },
      extensions: ['.foo'],
      id: 'foo',
      parseFragments: () => [],
    });

    processor.applyImport(
      // biome-ignore lint/suspicious/noExplicitAny: needed
      {} as any,
      'source',
      "import { t } from 'yapyak';",
    );
    expect(calls).toEqual(["source|import { t } from 'yapyak';"]);
  });

  it('forwards calls to the provided parseFragments hook', () => {
    const processor = createProcessor({
      applyImport: () => {},
      extensions: ['.foo'],
      id: 'foo',
      parseFragments: (source) => [
        { code: source, kind: 'script', lang: 'ts', originalOffset: 0 },
      ],
    });

    const fragments = processor.parseFragments('let x = 1;');
    expect(fragments).toEqual([
      { code: 'let x = 1;', kind: 'script', lang: 'ts', originalOffset: 0 },
    ]);
  });

  it('refuses construction when id is empty', () => {
    expect(() =>
      createProcessor({
        applyImport: () => {},
        extensions: ['.foo'],
        id: '',
        parseFragments: () => [],
      }),
    ).toThrow(/id must be a non-empty string/);
  });

  it('refuses construction when extensions is empty', () => {
    expect(() =>
      createProcessor({
        applyImport: () => {},
        extensions: [],
        id: 'foo',
        parseFragments: () => [],
      }),
    ).toThrow(/extensions must be a non-empty array/);
  });
});
