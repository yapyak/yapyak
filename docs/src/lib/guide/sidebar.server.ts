import type { SidebarNode } from './types';

import { parseFrontmatterOnly } from '#lib/markdoc';

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

interface Frontmatter {
  order?: number;
  redirect?: string;
  title?: string;
}

export async function buildGuideSidebar(projectRoot: string) {
  return walkDir(join(projectRoot, 'content', 'guide'), '/guide');
}

async function walkDir(absDir: string, urlPrefix: string) {
  const entries = await readdir(absDir, { withFileTypes: true });
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
  const frontmatter = parseFrontmatterOnly(source) as Frontmatter;
  if (typeof frontmatter.redirect === 'string') {
    return null;
  }
  const title =
    typeof frontmatter.title === 'string'
      ? frontmatter.title
      : deriveTitle(href);
  const order =
    typeof frontmatter.order === 'number'
      ? frontmatter.order
      : Number.POSITIVE_INFINITY;
  return {
    node: { href, title, type: 'link' as const },
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
    indexSource !== null
      ? (parseFrontmatterOnly(indexSource) as Frontmatter)
      : ({} as Frontmatter);

  const items = await walkDir(absDir, urlPrefix);
  if (items.length === 0) {
    return null;
  }

  const title =
    typeof indexFrontmatter.title === 'string'
      ? indexFrontmatter.title
      : capitalize(folderName);
  const order =
    typeof indexFrontmatter.order === 'number'
      ? indexFrontmatter.order
      : Number.POSITIVE_INFINITY;

  return {
    node: { items, title, type: 'group' as const },
    order,
  };
}

function deriveTitle(href: string) {
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
