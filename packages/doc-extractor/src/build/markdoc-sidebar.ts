import type { Dirent } from 'node:fs';
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
  let entries: Dirent[];
  try {
    entries = await readdir(absoluteDirectory, {
      withFileTypes: true,
    });
  } catch {
    return [];
  }
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
      if (group !== undefined) {
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
      if (link !== undefined) {
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

async function buildLink(absolutePath: string, href: string) {
  let source: string;
  try {
    source = await readFile(absolutePath, 'utf8');
  } catch {
    return undefined;
  }
  const frontmatter = parseFrontmatterOnly(source);
  if (typeof frontmatter.redirect === 'string') {
    return undefined;
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
  let indexFrontmatter: Record<string, unknown> = {};
  try {
    const indexSource = await readFile(indexPath, 'utf8');
    indexFrontmatter = parseFrontmatterOnly(indexSource);
  } catch {
    indexFrontmatter = {};
  }

  const items = await walkDirectory(absoluteDirectory, urlPrefix);
  if (items.length === 0) {
    return undefined;
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
