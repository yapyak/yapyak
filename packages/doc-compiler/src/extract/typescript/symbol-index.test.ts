import type { ReferenceManifest } from './type';

import { describe, expect, it } from 'vitest';

import { buildSymbolIndex } from './symbol-index';

function manifest(modules: ReferenceManifest['modules']): ReferenceManifest {
  return {
    modules,
    packageName: 'yapyak',
  };
}

function symbol(
  name: string,
): ReferenceManifest['modules'][number]['exports'][number] {
  return {
    deprecated: null,
    description: '',
    displayKind: 'function',
    examples: [],
    kind: 'function',
    location: {
      column: 1,
      file: 'src/index.ts',
      line: 1,
    },
    members: [],
    name,
    overloads: [],
    remarks: '',
    seeAlso: [],
    shape: '',
    tags: [],
    throws: [],
  };
}

describe('buildSymbolIndex', () => {
  it('builds bare and fully-qualified entries for every export', () => {
    const result = buildSymbolIndex(
      manifest([
        {
          description: '',
          exports: [
            symbol('createTranslator'),
          ],
          id: 'yapyak/translator',
          sourcePath: 'src/translator/index.ts',
          subpath: './translator',
        },
      ]),
    );

    expect(result.get('yapyak/translator::createTranslator')).toBe(
      'yapyak/translator',
    );
    expect(result.get('createTranslator')).toBe('yapyak/translator');
  });

  it('keeps the first module when two exports share a bare name', () => {
    const result = buildSymbolIndex(
      manifest([
        {
          description: '',
          exports: [
            symbol('createTranslator'),
          ],
          id: 'yapyak/translator',
          sourcePath: 'src/translator/index.ts',
          subpath: './translator',
        },
        {
          description: '',
          exports: [
            symbol('createTranslator'),
          ],
          id: 'yapyak/processor',
          sourcePath: 'src/processor/index.ts',
          subpath: './processor',
        },
      ]),
    );

    expect(result.get('createTranslator')).toBe('yapyak/translator');
    expect(result.get('yapyak/processor::createTranslator')).toBe(
      'yapyak/processor',
    );
  });

  it('returns an empty index for a manifest with no modules', () => {
    expect(buildSymbolIndex(manifest([])).size).toBe(0);
  });
});
