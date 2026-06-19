import type {
  ReferenceExport,
  ReferenceModule,
  ReferenceTypeAlias,
  ReferenceVariable,
} from './type';

import { describe, expect, it } from 'vitest';

import {
  buildModulePage,
  buildPackageIndexPage,
  buildSymbolPage,
} from './page';
import { buildSymbolIndex } from './symbol-index';

const CONTEXT = {
  collectionName: 'reference',
  packageName: 'yapyak',
  packageSlug: 'yapyak',
};

const SYMBOL_PAGE_INPUT = {
  href: '/reference/yapyak/createTranslator',
  index: new Map<string, string>(),
  moduleId: 'yapyak',
  packageDir: '/tmp/yapyak',
};

function functionSymbol(
  overrides: Partial<
    Extract<
      ReferenceExport,
      {
        kind: 'function';
      }
    >
  > = {},
): Extract<
  ReferenceExport,
  {
    kind: 'function';
  }
> {
  return {
    deprecated: null,
    description: '',
    examples: [],
    kind: 'function',
    location: {
      column: 1,
      file: 'src/index.ts',
      line: 1,
    },
    members: [],
    name: 'createTranslator',
    overloads: [
      {
        parameters: [],
        returnType: [],
        signature: 'function createTranslator(): void',
        typeParameters: [],
      },
    ],
    remarks: '',
    seeAlso: [],
    shape: '',
    tags: [],
    throws: [],
    ...overrides,
  };
}

function typeSymbol(
  overrides: Partial<ReferenceTypeAlias> = {},
): ReferenceTypeAlias {
  return {
    deprecated: null,
    description: '',
    examples: [],
    kind: 'type',
    location: {
      column: 1,
      file: 'src/index.ts',
      line: 1,
    },
    members: [],
    name: 'Settings',
    remarks: '',
    resolvedType: [],
    seeAlso: [],
    shape: '',
    signature: 'type Settings = {}',
    tags: [],
    throws: [],
    ...overrides,
  };
}

function variableSymbol(
  overrides: Partial<ReferenceVariable> = {},
): ReferenceVariable {
  return {
    deprecated: null,
    description: '',
    examples: [],
    kind: 'variable',
    location: {
      column: 1,
      file: 'src/index.ts',
      line: 1,
    },
    name: 'settings',
    remarks: '',
    seeAlso: [],
    shape: '',
    tags: [],
    throws: [],
    type: [],
    ...overrides,
  };
}

describe('buildModulePage', () => {
  it('builds a page with the module label as title', () => {
    const module: ReferenceModule = {
      description: '',
      exports: [],
      id: 'yapyak',
      sourcePath: 'src/index.ts',
      subpath: '.',
    };

    const page = buildModulePage(module, CONTEXT, {
      href: '/reference/yapyak',
      index: buildSymbolIndex({
        modules: [
          module,
        ],
        packageName: 'yapyak',
      }),
      label: 'yapyak',
    });

    expect(page.title).toBe('yapyak');
    expect(page.href).toBe('/reference/yapyak');
  });

  it('builds an `Exports` heading and table when the module has exports', () => {
    const symbol = functionSymbol();
    const module: ReferenceModule = {
      description: '',
      exports: [
        symbol,
      ],
      id: 'yapyak',
      sourcePath: 'src/index.ts',
      subpath: '.',
    };

    const page = buildModulePage(module, CONTEXT, {
      href: '/reference/yapyak',
      index: buildSymbolIndex({
        modules: [
          module,
        ],
        packageName: 'yapyak',
      }),
      label: 'yapyak',
    });

    expect(page.blocks).toContainEqual({
      children: [
        {
          type: 'text',
          value: 'Exports',
        },
      ],
      id: 'exports',
      level: 2,
      type: 'heading',
    });
  });

  it('skips the `Exports` heading when the module has no exports', () => {
    const module: ReferenceModule = {
      description: '',
      exports: [],
      id: 'yapyak',
      sourcePath: 'src/index.ts',
      subpath: '.',
    };

    const page = buildModulePage(module, CONTEXT, {
      href: '/reference/yapyak',
      index: new Map(),
      label: 'yapyak',
    });

    const hasExportsHeading = page.blocks.some(
      (block) =>
        block.type === 'heading' &&
        block.children[0]?.type === 'text' &&
        block.children[0]?.value === 'Exports',
    );
    expect(hasExportsHeading).toBe(false);
  });
});

describe('buildPackageIndexPage', () => {
  it('builds a page with an `eyebrow` block carrying the package name', () => {
    const page = buildPackageIndexPage(CONTEXT, {
      href: '/reference/yapyak',
      label: 'yapyak',
      subpaths: [],
    });

    expect(page.blocks[0]).toEqual({
      kind: null,
      module: 'yapyak',
      sourceHref: null,
      type: 'eyebrow',
    });
  });

  it('builds a `Subpaths` heading and table when subpaths are provided', () => {
    const page = buildPackageIndexPage(CONTEXT, {
      href: '/reference/yapyak',
      label: 'yapyak',
      subpaths: [
        {
          description: 'Hello',
          href: '/reference/yapyak/processor',
          subpath: './processor',
        },
      ],
    });

    expect(page.blocks).toContainEqual({
      children: [
        {
          type: 'text',
          value: 'Subpaths',
        },
      ],
      id: 'subpaths',
      level: 2,
      type: 'heading',
    });
  });

  it('skips the `Subpaths` section when no subpaths are provided', () => {
    const page = buildPackageIndexPage(CONTEXT, {
      href: '/reference/yapyak',
      label: 'yapyak',
      subpaths: [],
    });

    expect(page.blocks).toHaveLength(1);
  });
});

describe('buildSymbolPage', () => {
  it('builds a page with `()` suffix in the title for a function', () => {
    const page = buildSymbolPage(functionSymbol(), CONTEXT, SYMBOL_PAGE_INPUT);

    expect(page.title).toBe('createTranslator()');
  });

  it('builds a page without `()` suffix in the title for a non-function', () => {
    const page = buildSymbolPage(typeSymbol(), CONTEXT, {
      ...SYMBOL_PAGE_INPUT,
      href: '/reference/yapyak/Settings',
    });

    expect(page.title).toBe('Settings');
  });

  it('builds a `callout` block when the symbol is deprecated', () => {
    const page = buildSymbolPage(
      functionSymbol({
        deprecated: 'Use `createProcessor`',
      }),
      CONTEXT,
      SYMBOL_PAGE_INPUT,
    );

    const callout = page.blocks.find((block) => block.type === 'callout');
    expect(callout).toEqual({
      children: [
        {
          children: [
            {
              type: 'text',
              value: 'Use `createProcessor`',
            },
          ],
          type: 'paragraph',
        },
      ],
      title: 'Deprecated',
      type: 'callout',
      variant: 'warning',
    });
  });

  it('builds a `Signature` heading for a function symbol', () => {
    const page = buildSymbolPage(functionSymbol(), CONTEXT, SYMBOL_PAGE_INPUT);

    const headings = page.blocks
      .filter((block) => block.type === 'heading')
      .map((block) =>
        block.type === 'heading' && block.children[0]?.type === 'text'
          ? block.children[0].value
          : '',
      );
    expect(headings).toContain('Signature');
  });

  it('builds a `Type` heading for a variable symbol', () => {
    const page = buildSymbolPage(variableSymbol(), CONTEXT, {
      ...SYMBOL_PAGE_INPUT,
      href: '/reference/yapyak/settings',
    });

    const hasTypeHeading = page.blocks.some(
      (block) =>
        block.type === 'heading' &&
        block.children[0]?.type === 'text' &&
        block.children[0]?.value === 'Type',
    );
    expect(hasTypeHeading).toBe(true);
  });

  it('builds an `Examples` heading when the symbol has examples', () => {
    const page = buildSymbolPage(
      functionSymbol({
        examples: [
          {
            code: 'createTranslator()',
            language: 'ts',
            path: null,
            title: null,
          },
        ],
      }),
      CONTEXT,
      SYMBOL_PAGE_INPUT,
    );

    const hasExamplesHeading = page.blocks.some(
      (block) =>
        block.type === 'heading' &&
        block.children[0]?.type === 'text' &&
        block.children[0]?.value === 'Examples',
    );
    expect(hasExamplesHeading).toBe(true);
  });

  it('builds a `Throws` heading when the symbol has throws entries', () => {
    const page = buildSymbolPage(
      functionSymbol({
        throws: [
          {
            condition: 'Hello',
            errorClass: 'Error',
          },
        ],
      }),
      CONTEXT,
      SYMBOL_PAGE_INPUT,
    );

    const hasThrowsHeading = page.blocks.some(
      (block) =>
        block.type === 'heading' &&
        block.children[0]?.type === 'text' &&
        block.children[0]?.value === 'Throws',
    );
    expect(hasThrowsHeading).toBe(true);
  });

  it('builds a `See also` heading when the symbol has see-also entries', () => {
    const page = buildSymbolPage(
      functionSymbol({
        seeAlso: [
          'createProcessor',
        ],
      }),
      CONTEXT,
      SYMBOL_PAGE_INPUT,
    );

    const hasSeeAlsoHeading = page.blocks.some(
      (block) =>
        block.type === 'heading' &&
        block.children[0]?.type === 'text' &&
        block.children[0]?.value === 'See also',
    );
    expect(hasSeeAlsoHeading).toBe(true);
  });

  it('builds an `eyebrow` block with the resolved source href when `sourceUrl` is provided', () => {
    const page = buildSymbolPage(functionSymbol(), CONTEXT, SYMBOL_PAGE_INPUT, {
      sourceUrl: {
        template: 'https://github.com/yapyak/yapyak/blob/main/{path}#L{line}',
        workspaceRoot: '/tmp',
      },
    });

    expect(page.blocks[0]).toEqual({
      kind: 'function',
      module: 'yapyak',
      sourceHref:
        'https://github.com/yapyak/yapyak/blob/main/yapyak/src/index.ts#L1',
      type: 'eyebrow',
    });
  });

  it('builds an `eyebrow` block without source href when `sourceUrl` is omitted', () => {
    const page = buildSymbolPage(functionSymbol(), CONTEXT, SYMBOL_PAGE_INPUT);

    expect(page.blocks[0]).toEqual({
      kind: 'function',
      module: 'yapyak',
      sourceHref: null,
      type: 'eyebrow',
    });
  });
});
