import type { SidebarNode } from './manifest';

import { parseFrontmatterOnly } from '../extract/markdoc';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

export async function buildMarkdocSidebar(
  root: string,
  collectionName: string,
): Promise<SidebarNode[]> {
  return walkDirectory(root, `/${collectionName}`);
}

async function walkDirectory(
  absoluteDirectory: string,
  urlPrefix: string,
): Promise<SidebarNode[]> {
  const entries = await readdir(absoluteDirectory, {
    withFileTypes: true,
  }).catch(() => []);
  const collected: {
    node: SidebarNode;
    order: number;
    name: string;
  }[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) {
      continue;
    }
    const fullPath = join(absoluteDirectory, entry.name);

    if (entry.isDirectory()) {
      const group = await buildGroup(
        fullPath,
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
      const link = await buildLink(fullPath, `${urlPrefix}/${slug}`);
      if (link !== null) {
        collected.push({
          name: slug,
          node: link.node,
          order: link.order,
        });
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
    typeof frontmatter.title === 'string' ? frontmatter.title : getLabel(href);
  const order =
    typeof frontmatter.order === 'number'
      ? frontmatter.order
      : Number.POSITIVE_INFINITY;
  return {
    node: {
      href,
      label,
      type: 'link' as const,
    },
    order,
  };
}

async function buildGroup(
  absoluteDirectory: string,
  urlPrefix: string,
  folderName: string,
) {
  const indexPath = join(absoluteDirectory, 'index.md');
  const indexSource = await readFile(indexPath, 'utf8').catch(() => null);
  const indexFrontmatter =
    indexSource === null ? {} : parseFrontmatterOnly(indexSource);

  const items = await walkDirectory(absoluteDirectory, urlPrefix);
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

function getLabel(href: string) {
  const last = href.split('/').pop() ?? '';
  return last.split('-').map(capitalize).join(' ');
}

function capitalize(value: string) {
  if (value.length === 0) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}
