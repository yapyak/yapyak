import type { ReferenceExport, ReferenceManifest } from '../extract/typescript';

import { describe, expect, it } from 'vitest';

import { buildPackageRoot } from './package-root';

const CONTEXT = {
  collectionName: 'reference',
  packageName: 'yapyak',
  packageSlug: 'yapyak',
};

function symbol(
  name: string,
  deprecated: string | null = null,
): ReferenceExport {
  return {
    deprecated,
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

function manifest(modules: ReferenceManifest['modules']): ReferenceManifest {
  return {
    modules,
    packageName: 'yapyak',
  };
}

describe('buildPackageRoot', () => {
  it('builds a `group` whose children are the root module exports', () => {
    const result = buildPackageRoot(
      manifest([
        {
          description: '',
          exports: [
            symbol('createTranslator'),
          ],
          id: 'yapyak',
          sourcePath: 'src/index.ts',
          subpath: '.',
        },
      ]),
      CONTEXT,
      {
        collapsible: false,
        expanded: false,
        label: 'yapyak',
      },
    );

    expect(result).toEqual({
      children: [
        {
          href: '/reference/yapyak/createTranslator',
          label: 'createTranslator()',
          type: 'link',
        },
      ],
      collapsible: false,
      href: '/reference/yapyak',
      label: 'yapyak',
      type: 'group',
    });
  });

  it('builds a nested `group` for each sub-module under the root module', () => {
    const result = buildPackageRoot(
      manifest([
        {
          description: '',
          exports: [],
          id: 'yapyak',
          sourcePath: 'src/index.ts',
          subpath: '.',
        },
        {
          description: '',
          exports: [
            symbol('createProcessor'),
          ],
          id: 'yapyak/processor',
          sourcePath: 'src/processor/index.ts',
          subpath: './processor',
        },
      ]),
      CONTEXT,
      {
        collapsible: true,
        expanded: true,
        label: 'yapyak',
      },
    );

    if (result.type !== 'group') {
      throw new Error('expected a group');
    }
    expect(result.children).toEqual([
      {
        children: [
          {
            href: '/reference/yapyak/processor/createProcessor',
            label: 'createProcessor()',
            type: 'link',
          },
        ],
        collapsible: true,
        href: '/reference/yapyak/processor',
        label: 'processor',
        type: 'group',
      },
    ]);
  });

  it('builds a top-level sub-module list when no root module is present', () => {
    const result = buildPackageRoot(
      manifest([
        {
          description: '',
          exports: [
            symbol('createProcessor'),
          ],
          id: 'yapyak/processor',
          sourcePath: 'src/processor/index.ts',
          subpath: './processor',
        },
      ]),
      CONTEXT,
      {
        collapsible: false,
        expanded: false,
        label: 'yapyak',
      },
    );

    if (result.type !== 'group') {
      throw new Error('expected a group');
    }
    expect(result.children).toEqual([
      {
        children: [
          {
            href: '/reference/yapyak/processor/createProcessor',
            label: 'createProcessor()',
            type: 'link',
          },
        ],
        collapsible: true,
        href: '/reference/yapyak/processor',
        label: 'processor',
        type: 'group',
      },
    ]);
  });

  it('builds a link without `()` for a non-function export', () => {
    const result = buildPackageRoot(
      manifest([
        {
          description: '',
          exports: [
            {
              ...symbol('Settings'),
              callSignatures: [],
              displayKind: 'type',
              kind: 'type',
              members: [],
              resolvedType: [],
              signature: 'type Settings = {}',
            },
          ],
          id: 'yapyak',
          sourcePath: 'src/index.ts',
          subpath: '.',
        },
      ]),
      CONTEXT,
      {
        collapsible: false,
        expanded: false,
        label: 'yapyak',
      },
    );

    if (result.type !== 'group') {
      throw new Error('expected a group');
    }
    expect(result.children).toEqual([
      {
        href: '/reference/yapyak/Settings',
        label: 'Settings',
        type: 'link',
      },
    ]);
  });

  it('builds a link with a deprecated badge when the export is deprecated', () => {
    const result = buildPackageRoot(
      manifest([
        {
          description: '',
          exports: [
            symbol('createTranslator', 'Use `createProcessor`'),
          ],
          id: 'yapyak',
          sourcePath: 'src/index.ts',
          subpath: '.',
        },
      ]),
      CONTEXT,
      {
        collapsible: false,
        expanded: false,
        label: 'yapyak',
      },
    );

    if (result.type !== 'group') {
      throw new Error('expected a group');
    }
    expect(result.children).toEqual([
      {
        badge: {
          variant: 'deprecated',
        },
        href: '/reference/yapyak/createTranslator',
        label: 'createTranslator()',
        type: 'link',
      },
    ]);
  });
});
