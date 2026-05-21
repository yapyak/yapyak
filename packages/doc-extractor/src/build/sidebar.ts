import type {
  ReferenceManifest,
  ReferenceModule,
} from '../extract/typedoc/types.ts';
import type { SidebarNode } from '../types/manifest.ts';

import { parseFrontmatterOnly } from '../extract/markdoc/parse.ts';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function buildMarkdocSidebar(
  root: string,
  collectionName: string,
): Promise<SidebarNode[]> {
  return walkDir(root, `/${collectionName}`);
}

async function walkDir(
  absDir: string,
  urlPrefix: string,
): Promise<SidebarNode[]> {
  const entries = await readdir(absDir, { withFileTypes: true }).catch(
    () => [],
  );
  const collected: { node: SidebarNode; order: number; name: string }[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) {
      continue;
    }
    const full = join(absDir, entry.name);

    if (entry.isDirectory()) {
      const group = await buildGroup(
        full,
        `${urlPrefix}/${entry.name}`,
        entry.name,
      );
      if (group !== null) {
        collected.push({
          name: entry.name,
          node: group.node,
          order: group.order,
        });
      }
      continue;
    }

    if (
      entry.isFile() &&
      entry.name.endsWith('.md') &&
      entry.name !== 'index.md'
    ) {
      const slug = entry.name.replace(/\.md$/, '');
      const link = await buildLink(full, `${urlPrefix}/${slug}`);
      if (link !== null) {
        collected.push({ name: slug, node: link.node, order: link.order });
      }
    }
  }

  collected.sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    return a.name.localeCompare(b.name);
  });

  return collected.map((item) => item.node);
}

async function buildLink(absPath: string, href: string) {
  const source = await readFile(absPath, 'utf8').catch(() => null);
  if (source === null) {
    return null;
  }
  const frontmatter = parseFrontmatterOnly(source);
  if (typeof frontmatter.redirect === 'string') {
    return null;
  }
  const label =
    typeof frontmatter.title === 'string'
      ? frontmatter.title
      : deriveLabel(href);
  const order =
    typeof frontmatter.order === 'number'
      ? frontmatter.order
      : Number.POSITIVE_INFINITY;
  return {
    node: { href, label, type: 'link' as const },
    order,
  };
}

async function buildGroup(
  absDir: string,
  urlPrefix: string,
  folderName: string,
) {
  const indexPath = join(absDir, 'index.md');
  const indexSource = await readFile(indexPath, 'utf8').catch(() => null);
  const indexFrontmatter =
    indexSource !== null ? parseFrontmatterOnly(indexSource) : {};

  const items = await walkDir(absDir, urlPrefix);
  if (items.length === 0) {
    return null;
  }

  const label =
    typeof indexFrontmatter.title === 'string'
      ? indexFrontmatter.title
      : capitalize(folderName);
  const order =
    typeof indexFrontmatter.order === 'number'
      ? indexFrontmatter.order
      : Number.POSITIVE_INFINITY;

  return {
    node: {
      children: items,
      collapsible: false,
      label,
      type: 'group' as const,
    },
    order,
  };
}

function deriveLabel(href: string) {
  const last = href.split('/').pop() ?? '';
  return last
    .split('-')
    .map((part) => capitalize(part))
    .join(' ');
}

function capitalize(value: string) {
  if (value.length === 0) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function buildTypedocSidebar(
  manifest: ReferenceManifest,
  collectionName: string,
  rootModule: string,
): SidebarNode[] {
  const byId = new Map<string, ReferenceModule>();
  for (const module of manifest.modules) {
    byId.set(module.id, module);
  }
  const childrenById = new Map<string, ReferenceModule[]>();
  for (const id of byId.keys()) {
    const parentId = findParentId(id, byId);
    if (parentId === null) {
      continue;
    }
    let list = childrenById.get(parentId);
    if (list === undefined) {
      list = [];
      childrenById.set(parentId, list);
    }
    const module = byId.get(id);
    if (module !== undefined) {
      list.push(module);
    }
  }

  const root = byId.get(rootModule);
  if (root === undefined) {
    return [];
  }
  return moduleChildren(root, byId, childrenById, collectionName, rootModule);
}

function moduleChildren(
  module: ReferenceModule,
  byId: Map<string, ReferenceModule>,
  childrenById: Map<string, ReferenceModule[]>,
  collectionName: string,
  rootModule: string,
): SidebarNode[] {
  const nodes: SidebarNode[] = [];
  for (const api of module.exports) {
    nodes.push({
      badge: api.deprecated !== null ? { variant: 'deprecated' } : undefined,
      href: symbolHref(module.id, api.name, collectionName, rootModule),
      label: api.kind === 'function' ? `${api.name}()` : api.name,
      type: 'link',
    });
  }
  const subModules = (childrenById.get(module.id) ?? [])
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id));
  for (const child of subModules) {
    nodes.push({
      children: moduleChildren(
        child,
        byId,
        childrenById,
        collectionName,
        rootModule,
      ),
      collapsible: true,
      label: lastSegment(child.id),
      type: 'group',
    });
  }
  return nodes;
}

function findParentId(id: string, byId: Map<string, ReferenceModule>) {
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

function symbolHref(
  moduleId: string,
  name: string,
  collectionName: string,
  rootModule: string,
) {
  if (moduleId === rootModule) {
    return `/${collectionName}/${name}`;
  }
  const slug = moduleId.slice(rootModule.length + 1);
  return `/${collectionName}/${slug}/${name}`;
}

function lastSegment(id: string) {
  const slashIndex = id.lastIndexOf('/');
  return slashIndex === -1 ? id : id.slice(slashIndex + 1);
}
