import type { RefModule, RefSymbol } from './build-reference-sidebar';
import type { ApiManifest, ApiModule } from './extract-api.server';

export function buildReferenceSidebar(manifest: ApiManifest) {
  const byId = new Map<string, ApiModule>();
  for (const module of manifest.modules) {
    byId.set(module.id, module);
  }

  const sortedIds = [...byId.keys()].sort();
  const built = new Map<string, RefModule>();
  const topLevel: RefModule[] = [];

  for (const id of sortedIds) {
    const module = byId.get(id);
    if (module === undefined) {
      continue;
    }
    const node = buildModule(module);
    built.set(id, node);
    const parentId = findParentId(id, byId);
    if (parentId === null) {
      topLevel.push(node);
      continue;
    }
    const parent = built.get(parentId);
    if (parent === undefined) {
      topLevel.push(node);
      continue;
    }
    parent.submodules.push(node);
  }

  return { modules: topLevel };
}

function buildModule(module: ApiModule) {
  const isRoot = module.id === 'yapyak';
  const slug = moduleSlug(module.id);
  const href = isRoot ? '/reference' : `/reference/${slug}`;
  const symbols: RefSymbol[] = module.exports.map((api) => ({
    href: isRoot ? `/reference/${api.name}` : `${href}/${api.name}`,
    isDeprecated: api.deprecated !== null,
    kind: api.kind,
    name: api.name,
  }));
  return {
    href,
    id: module.id,
    submodules: [],
    symbols,
  };
}

function findParentId(id: string, byId: Map<string, ApiModule>) {
  let cursor = id;
  while (true) {
    const slashIndex = cursor.lastIndexOf('/');
    if (slashIndex === -1) {
      return null;
    }
    cursor = cursor.slice(0, slashIndex);
    if (byId.has(cursor)) {
      return cursor;
    }
  }
}

export function moduleSlug(id: string) {
  const trimmed = id.replace(/^yapyak\/?/, '');
  return trimmed === '' ? 'yapyak' : trimmed;
}
