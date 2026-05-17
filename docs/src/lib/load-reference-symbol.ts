import { createServerFn } from '@tanstack/react-start';

export const loadReferenceSymbol = createServerFn()
  .inputValidator((path: string) => path)
  .handler(async ({ data: path }) => {
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
        return { kind: 'not-found' as const };
      }
      const isRoot = moduleMatch.id === 'yapyak';
      const slug = moduleSlug(moduleMatch.id);
      return {
        kind: 'redirect' as const,
        target: isRoot ? firstExport.name : `${slug}/${firstExport.name}`,
      };
    }

    const lastSlash = path.lastIndexOf('/');
    const parentSlug = lastSlash === -1 ? '' : path.slice(0, lastSlash);
    const symbolName = lastSlash === -1 ? path : path.slice(lastSlash + 1);
    const parentId = slugToModuleId(parentSlug);
    const parent = manifest.modules.find((module) => module.id === parentId);
    if (parent === undefined) {
      return { kind: 'not-found' as const };
    }
    const symbol = parent.exports.find((entry) => entry.name === symbolName);
    if (symbol === undefined) {
      return { kind: 'not-found' as const };
    }
    const descriptionTree = symbol.description
      ? parseMarkdoc(symbol.description).tree
      : null;
    const exampleTrees = symbol.examples.map(
      (example) => parseMarkdoc(example).tree,
    );
    return {
      kind: 'symbol' as const,
      module: parent,
      rendered: { descriptionTree, exampleTrees, symbol },
    };
  });

function slugToModuleId(slug: string) {
  if (slug === '' || slug === 'yapyak') {
    return 'yapyak';
  }
  return `yapyak/${slug}`;
}

function moduleSlug(id: string) {
  const trimmed = id.replace(/^yapyak\/?/, '');
  return trimmed === '' ? 'yapyak' : trimmed;
}
