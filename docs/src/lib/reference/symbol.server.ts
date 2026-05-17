import { parseContent } from '#lib/content';

import { loadManifest } from './manifest.server';

export async function loadReferenceSymbol(path: string) {
  const manifest = await loadManifest(process.cwd());

  const moduleId = slugToModuleId(path);
  const moduleMatch = manifest.modules.find((module) => module.id === moduleId);
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
  const descriptionBlocks = symbol.description
    ? parseContent(symbol.description).blocks
    : null;
  const exampleBlocks = symbol.examples.map(
    (example) => parseContent(example).blocks,
  );
  return {
    kind: 'symbol' as const,
    module: parent,
    rendered: { descriptionBlocks, exampleBlocks, symbol },
  };
}

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
