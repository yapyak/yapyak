import type { ApiExport, ApiManifest, ApiModule } from './extract-api';

export interface ReferenceSidebar {
  modules: RefModule[];
}

export interface RefModule {
  id: string;
  href: string;
  symbols: RefSymbol[];
  submodules: RefModule[];
}

export interface RefSymbol {
  name: string;
  kind: ApiExport['kind'];
  deprecated: boolean;
  href: string;
}

export function buildReferenceSidebar(manifest: ApiManifest): ReferenceSidebar {
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

function buildModule(module: ApiModule): RefModule {
  const isRoot = module.id === 'yapyak';
  const slug = moduleSlug(module.id);
  const href = isRoot ? '/reference' : `/reference/${slug}`;
  const symbols: RefSymbol[] = module.exports.map((api) => ({
    name: api.name,
    kind: api.kind,
    deprecated: api.deprecated !== null,
    href: isRoot
      ? `/reference/${api.name}`
      : `${href}/${api.name}`,
  }));
  return {
    id: module.id,
    href,
    symbols,
    submodules: [],
  };
}

function findParentId(
  id: string,
  byId: Map<string, ApiModule>,
): string | null {
  let cursor = id;
  while (true) {
    const idx = cursor.lastIndexOf('/');
    if (idx === -1) {
      return null;
    }
    cursor = cursor.slice(0, idx);
    if (byId.has(cursor)) {
      return cursor;
    }
  }
}

export function moduleSlug(id: string): string {
  const trimmed = id.replace(/^yapyak\/?/, '');
  return trimmed === '' ? 'yapyak' : trimmed;
}

