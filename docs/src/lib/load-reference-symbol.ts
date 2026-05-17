import type { ApiExport, ApiModule } from '#docs/extract-api';
import type { MarkdocNode } from '#lib/markdoc';

import { createServerFn } from '@tanstack/react-start';

export type ReferenceSymbolResult =
  | { kind: 'symbol'; module: ApiModule; rendered: RenderedReferenceSymbol }
  | { kind: 'redirect'; target: string }
  | { kind: 'not-found' };

export interface RenderedReferenceSymbol {
  descriptionTree: MarkdocNode[] | null;
  exampleTrees: MarkdocNode[][];
  symbol: ApiExport;
}

export const loadReferenceSymbol = createServerFn()
  .inputValidator((path: string) => path)
  .handler(async ({ data: path }): Promise<ReferenceSymbolResult> => {
    const { loadManifest } = await import('#docs/load-manifest');
    const { parseMarkdoc } = await import('#lib/markdoc');
    const manifest = await loadManifest(process.cwd());

    const moduleId = slugToModuleId(path);
    const moduleMatch = manifest.modules.find(
      (module) => module.id === moduleId,
    );
    if (moduleMatch !== undefined) {
      const firstExport = moduleMatch.exports[0];
      if (firstExport === undefined) {
        return { kind: 'not-found' };
      }
      const isRoot = moduleMatch.id === 'yapyak';
      const slug = moduleSlug(moduleMatch.id);
      return {
        kind: 'redirect',
        target: isRoot ? firstExport.name : `${slug}/${firstExport.name}`,
      };
    }

    const lastSlash = path.lastIndexOf('/');
    const parentSlug = lastSlash === -1 ? '' : path.slice(0, lastSlash);
    const symbolName = lastSlash === -1 ? path : path.slice(lastSlash + 1);
    const parentId = slugToModuleId(parentSlug);
    const parent = manifest.modules.find((module) => module.id === parentId);
    if (parent === undefined) {
      return { kind: 'not-found' };
    }
    const symbol = parent.exports.find((entry) => entry.name === symbolName);
    if (symbol === undefined) {
      return { kind: 'not-found' };
    }
    const descriptionTree = symbol.description
      ? parseMarkdoc(symbol.description).tree
      : null;
    const exampleTrees = symbol.examples.map(
      (example) => parseMarkdoc(example).tree,
    );
    return {
      kind: 'symbol',
      module: parent,
      rendered: { descriptionTree, exampleTrees, symbol },
    };
  });

function slugToModuleId(slug: string): string {
  if (slug === '' || slug === 'yapyak') {
    return 'yapyak';
  }
  return `yapyak/${slug}`;
}

function moduleSlug(id: string): string {
  const trimmed = id.replace(/^yapyak\/?/, '');
  return trimmed === '' ? 'yapyak' : trimmed;
}
