import { describe, expect, it } from 'vitest';

import { createProcessor } from './create';

describe('createProcessor', () => {
  it('returns a processor carrying id and extensions', () => {
    const processor = createProcessor(
      () => {},
      ['.foo'],
      'foo',
      () => [],
    );

    expect(processor.id).toBe('foo');
    expect(processor.extensions).toEqual(['.foo']);
  });

  it('writes calls through to the provided applyImport hook', () => {
    const calls: string[] = [];
    const processor = createProcessor(
      (_, source, importStatement) => {
        calls.push(`${source}|${importStatement}`);
      },
      ['.foo'],
      'foo',
      () => [],
    );

    processor.applyImport(
      // biome-ignore lint/suspicious/noExplicitAny: yap yap yap
      {} as any,
      'source',
      "import { t } from 'yapyak';",
    );
    expect(calls).toEqual(["source|import { t } from 'yapyak';"]);
  });

  it('writes calls through to the provided parseFragments hook', () => {
    const processor = createProcessor(
      () => {},
      ['.foo'],
      'foo',
      (source) => [
        { code: source, kind: 'script', lang: 'ts', originalOffset: 0 },
      ],
    );

    const fragments = processor.parseFragments('let x = 1;');
    expect(fragments).toEqual([
      { code: 'let x = 1;', kind: 'script', lang: 'ts', originalOffset: 0 },
    ]);
  });

  it('refuses construction when id is empty', () => {
    expect(() =>
      createProcessor(
        () => {},
        ['.foo'],
        '',
        () => [],
      ),
    ).toThrow(/id must be a non-empty string/);
  });

  it('refuses construction when extensions is empty', () => {
    expect(() =>
      createProcessor(
        () => {},
        [],
        'foo',
        () => [],
      ),
    ).toThrow(/extensions must be a non-empty array/);
  });
});
