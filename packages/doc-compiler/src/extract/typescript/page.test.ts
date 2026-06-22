import type { Block, LinkBlock } from '../../access';
import type {
  ReferenceExport,
  ReferenceModule,
  ReferenceTypeAlias,
  ReferenceVariable,
} from './type';

import { describe, expect, it } from 'vitest';

import {
  buildMethodPage,
  buildModulePage,
  buildPackageIndexPage,
  buildPropertyMemberPage,
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
  index: buildSymbolIndex([]),
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
    displayKind: 'function',
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
    callSignatures: [],
    deprecated: null,
    description: '',
    displayKind: 'type',
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
    displayKind: 'variable',
    examples: [],
    kind: 'variable',
    location: {
      column: 1,
      file: 'src/index.ts',
      line: 1,
    },
    members: [],
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
      index: buildSymbolIndex([]),
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
      index: buildSymbolIndex([
        {
          href: '/reference/yapyak/createTranslator',
          hrefsByMemberName: new Map(),
          moduleId: 'yapyak',
          name: 'createTranslator',
          packageSlug: 'yapyak',
        },
      ]),
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

  it('resolves an inline `{@link X}` reference in the description to an internal link when `X` is in the index', () => {
    const index = buildSymbolIndex([
      {
        href: '/reference/yapyak/translator/createTranslator',
        hrefsByMemberName: new Map(),
        moduleId: 'yapyak/translator',
        name: 'createTranslator',
        packageSlug: 'yapyak',
      },
    ]);
    const page = buildSymbolPage(
      typeSymbol({
        description: 'Returned by [createTranslator](symbol:createTranslator).',
        name: 'Translator',
      }),
      CONTEXT,
      {
        ...SYMBOL_PAGE_INPUT,
        href: '/reference/yapyak/translator/Translator',
        index,
      },
    );

    const link = findFirstLink(page.blocks);
    expect(link).toEqual({
      children: [
        {
          type: 'text',
          value: 'createTranslator',
        },
      ],
      href: '/reference/yapyak/translator/createTranslator',
      kind: 'internal',
      type: 'link',
    });
  });

  it('falls back to plain text when an inline `{@link X}` reference cannot be resolved', () => {
    const page = buildSymbolPage(
      typeSymbol({
        description: 'Returned by [createTranslator](symbol:createTranslator).',
        name: 'Translator',
      }),
      CONTEXT,
      {
        ...SYMBOL_PAGE_INPUT,
        href: '/reference/yapyak/translator/Translator',
        index: buildSymbolIndex([]),
      },
    );

    const link = findFirstLink(page.blocks);
    expect(link).toBeUndefined();
    const text = collectText(page.blocks);
    expect(text).toContain('Returned by createTranslator.');
  });

  it('resolves a `@see {@link X}` entry to an internal link when `X` is in the index', () => {
    const index = buildSymbolIndex([
      {
        href: '/reference/yapyak/translator/createTranslator',
        hrefsByMemberName: new Map(),
        moduleId: 'yapyak/translator',
        name: 'createTranslator',
        packageSlug: 'yapyak',
      },
    ]);
    const page = buildSymbolPage(
      functionSymbol({
        seeAlso: [
          'createTranslator',
        ],
      }),
      CONTEXT,
      {
        ...SYMBOL_PAGE_INPUT,
        index,
      },
    );

    const link = findFirstLink(page.blocks);
    expect(link).toEqual({
      children: [
        {
          type: 'text',
          value: 'createTranslator',
        },
      ],
      href: '/reference/yapyak/translator/createTranslator',
      kind: 'internal',
      type: 'link',
    });
  });

  it('falls back to plain text in `See also` when the symbol reference cannot be resolved', () => {
    const page = buildSymbolPage(
      functionSymbol({
        seeAlso: [
          'unknownThing',
        ],
      }),
      CONTEXT,
      {
        ...SYMBOL_PAGE_INPUT,
        index: buildSymbolIndex([]),
      },
    );

    const link = findFirstLink(page.blocks);
    expect(link).toBeUndefined();
    const text = collectText(page.blocks);
    expect(text).toContain('unknownThing');
  });
});

describe('buildMethodPage', () => {
  const FormatParent = variableSymbol({
    name: 'format',
  });
  const ParentLink = {
    href: '/reference/yapyak/Format',
    label: 'format',
  };
  const SiblingLinks = [
    {
      href: '/reference/yapyak/format.dateTime',
      label: 'format.dateTime',
    },
    {
      href: '/reference/yapyak/format.list',
      label: 'format.list',
    },
  ];

  function methodMember(name: string) {
    return {
      deprecated: null,
      description: 'Method description.',
      displayKind: 'function' as const,
      examples: [],
      kind: 'method' as const,
      location: {
        column: 1,
        file: 'src/index.ts',
        line: 1,
      },
      members: [],
      name,
      optional: false,
      overloads: [
        {
          parameters: [],
          returnType: [],
          signature: `${name}(): void`,
          typeParameters: [],
        },
      ],
      remarks: '',
      seeAlso: [] as string[],
      shape: '',
      tags: [],
      throws: [],
    };
  }

  it('auto-injects parent and sibling links into the `See also` section', () => {
    const page = buildMethodPage(
      FormatParent,
      methodMember('number'),
      CONTEXT,
      {
        ...SYMBOL_PAGE_INPUT,
        href: '/reference/yapyak/format.number',
        parent: ParentLink,
        siblings: SiblingLinks,
      },
    );

    expect(page.blocks).toContainEqual({
      children: [
        {
          type: 'text',
          value: 'See also',
        },
      ],
      id: 'see-also',
      level: 2,
      type: 'heading',
    });

    const hrefs = collectHrefs(page.blocks);
    expect(hrefs).toContain('/reference/yapyak/Format');
    expect(hrefs).toContain('/reference/yapyak/format.dateTime');
    expect(hrefs).toContain('/reference/yapyak/format.list');
  });

  it('keeps author `@see` entries before auto-injected entries', () => {
    const page = buildMethodPage(
      FormatParent,
      {
        ...methodMember('number'),
        seeAlso: [
          'parseRichText',
        ],
      },
      CONTEXT,
      {
        ...SYMBOL_PAGE_INPUT,
        href: '/reference/yapyak/format.number',
        index: buildSymbolIndex([
          {
            href: '/reference/yapyak/parseRichText',
            hrefsByMemberName: new Map(),
            moduleId: 'yapyak',
            name: 'parseRichText',
            packageSlug: 'yapyak',
          },
        ]),
        parent: ParentLink,
        siblings: SiblingLinks,
      },
    );

    const hrefs = collectHrefs(page.blocks);
    const parseIndex = hrefs.indexOf('/reference/yapyak/parseRichText');
    const parentIndex = hrefs.indexOf('/reference/yapyak/Format');
    expect(parseIndex).toBeGreaterThanOrEqual(0);
    expect(parentIndex).toBeGreaterThan(parseIndex);
  });

  it('emits a `See also` section with only auto entries when the method has no author `@see`', () => {
    const page = buildMethodPage(
      FormatParent,
      methodMember('number'),
      CONTEXT,
      {
        ...SYMBOL_PAGE_INPUT,
        href: '/reference/yapyak/format.number',
        parent: ParentLink,
        siblings: SiblingLinks,
      },
    );

    const hrefs = collectHrefs(page.blocks);
    expect(hrefs).toEqual([
      '/reference/yapyak/Format',
      '/reference/yapyak/format.dateTime',
      '/reference/yapyak/format.list',
    ]);
  });
});

describe('buildPropertyMemberPage', () => {
  const ParentLink = {
    href: '/reference/yapyak/settings',
    label: 'settings',
  };

  function propertyMember(name: string) {
    return {
      defaultValue: null,
      description: 'Property description.',
      kind: 'property' as const,
      name,
      optional: false,
      type: [],
    };
  }

  it('auto-injects parent and sibling links into the `See also` section', () => {
    const page = buildPropertyMemberPage(
      variableSymbol({
        name: 'settings',
      }),
      propertyMember('theme'),
      CONTEXT,
      {
        ...SYMBOL_PAGE_INPUT,
        href: '/reference/yapyak/settings.theme',
        parent: ParentLink,
        siblings: [
          {
            href: '/reference/yapyak/settings.locale',
            label: 'settings.locale',
          },
        ],
      },
    );

    const hrefs = collectHrefs(page.blocks);
    expect(hrefs).toContain('/reference/yapyak/settings');
    expect(hrefs).toContain('/reference/yapyak/settings.locale');
  });
});

function collectHrefs(blocks: Block[]): string[] {
  const hrefs: string[] = [];
  walkHrefs(blocks, hrefs);
  return hrefs;
}

function walkHrefs(blocks: Block[], out: string[]): void {
  for (const block of blocks) {
    if (block.type === 'link') {
      out.push(block.href);
    }
    if ('children' in block && Array.isArray(block.children)) {
      walkHrefs(block.children, out);
    }
    if (block.type === 'table') {
      if (block.head !== null) {
        walkHrefs(
          [
            block.head,
          ],
          out,
        );
      }
      walkHrefs(block.body, out);
    }
  }
}

function findFirstLink(blocks: Block[]): LinkBlock | undefined {
  for (const block of blocks) {
    if (block.type === 'link') {
      return block;
    }
    if ('children' in block && Array.isArray(block.children)) {
      const nested = findFirstLink(block.children);
      if (nested !== undefined) {
        return nested;
      }
    }
    if (block.type === 'table') {
      const head =
        block.head === null
          ? []
          : [
              block.head,
            ];
      const inHead = findFirstLink(head);
      if (inHead !== undefined) {
        return inHead;
      }
      const inBody = findFirstLink(block.body);
      if (inBody !== undefined) {
        return inBody;
      }
    }
  }
  return undefined;
}

function collectText(blocks: Block[]): string {
  const parts: string[] = [];
  walkText(blocks, parts);
  return parts.join('');
}

function walkText(blocks: Block[], out: string[]): void {
  for (const block of blocks) {
    if (block.type === 'text' || block.type === 'inline-code') {
      out.push(block.value);
      continue;
    }
    if ('children' in block && Array.isArray(block.children)) {
      walkText(block.children, out);
    }
    if (block.type === 'table') {
      if (block.head !== null) {
        walkText(
          [
            block.head,
          ],
          out,
        );
      }
      walkText(block.body, out);
    }
  }
}
