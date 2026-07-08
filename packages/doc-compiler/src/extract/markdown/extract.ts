import type { Dirent } from 'node:fs';
import type { Block } from '../../access';
import type { Page } from '../../build';

import { parseMarkdown } from './parse';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

type ExtractMarkdownResult = {
  pages: Map<string, Page>;
  redirects: Map<string, string>;
  watchedFiles: string[];
};

export async function extractMarkdown(
  root: string,
  collectionName: string,
  pathPrefix = '',
): Promise<ExtractMarkdownResult> {
  const files = await walkMarkdownFiles(root);
  const pages = new Map<string, Page>();
  const redirects = new Map<string, string>();
  for (const absolutePath of files) {
    const path = joinPath(pathPrefix, filePathToRoutePath(absolutePath, root));
    const href =
      path === '' ? `/${collectionName}` : `/${collectionName}/${path}`;
    const page = await loadMarkdownPage(absolutePath, href);
    if (page === undefined) {
      continue;
    }
    const redirectTarget = resolvePageRedirectTarget(
      page,
      path,
      collectionName,
    );
    if (redirectTarget !== undefined) {
      redirects.set(path, redirectTarget);
      continue;
    }
    pages.set(path, page);
  }
  return {
    pages,
    redirects,
    watchedFiles: files,
  };
}

async function loadMarkdownPage(
  absolutePath: string,
  href: string,
): Promise<Page | undefined> {
  let source: string;
  try {
    source = await readFile(absolutePath, 'utf8');
  } catch {
    return undefined;
  }
  const { blocks, frontmatter } = parseMarkdown(source);
  return {
    blocks: resolveBlocks(blocks, href),
    breadcrumbs: [],
    description: (frontmatter.description as string | undefined) ?? '',
    href,
    meta: frontmatter,
    title: (frontmatter.title as string | undefined) ?? '',
  };
}

function resolveBlocks(blocks: Block[], pageHref: string): Block[] {
  return blocks.map((block) => resolveBlock(block, pageHref));
}

function resolveBlock(block: Block, pageHref: string): Block {
  if (block.kind === 'link') {
    const { href, linkKind } = resolveLinkData(block.href, pageHref);
    return {
      ...block,
      children: resolveBlocks(block.children, pageHref),
      href,
      linkKind,
    };
  }
  if (block.kind === 'table') {
    return {
      ...block,
      body: block.body.map((row) => resolveBlock(row, pageHref) as typeof row),
      head: block.head
        ? (resolveBlock(block.head, pageHref) as typeof block.head)
        : null,
    };
  }
  if (block.kind === 'switch') {
    return {
      ...block,
      branches: Object.fromEntries(
        Object.entries(block.branches).map(([key, value]) => [
          key,
          resolveBlocks(value, pageHref),
        ]),
      ),
    };
  }
  if ('children' in block && Array.isArray(block.children)) {
    return {
      ...block,
      children: resolveBlocks(block.children, pageHref) as never,
    };
  }
  return block;
}

type LinkData = {
  href: string;
  linkKind: 'external' | 'internal';
};

function resolveLinkData(href: string, pageHref: string): LinkData {
  if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) {
    return {
      href,
      linkKind: 'external',
    };
  }
  if (href.startsWith('/')) {
    return {
      href,
      linkKind: 'internal',
    };
  }
  if (href.startsWith('#')) {
    return {
      href: `${pageHref}${href}`,
      linkKind: 'internal',
    };
  }
  const [pathPart = '', fragment = ''] = href.split('#');
  const segments = pageHref.split('/').slice(0, -1);
  for (const segment of pathPart.split('/')) {
    if (segment === '' || segment === '.') {
      continue;
    }
    if (segment === '..') {
      segments.pop();
      continue;
    }
    segments.push(segment);
  }
  const last = segments.at(-1);
  if (last !== undefined) {
    const stripped = last.replace(/\.md$/, '');
    segments[segments.length - 1] = stripped === 'index' ? '' : stripped;
  }
  const resolved =
    segments.filter((segment, index) => segment || index === 0).join('/') ||
    '/';
  return {
    href: fragment ? `${resolved}#${fragment}` : resolved,
    linkKind: 'internal',
  };
}

function resolvePageRedirectTarget(
  page: Page,
  path: string,
  collectionName: string,
): string | undefined {
  const raw = page.meta.redirect;
  if (typeof raw !== 'string' || raw.length === 0) {
    return undefined;
  }
  if (raw.startsWith('/')) {
    return raw;
  }
  const baseSegments = path === '' ? [] : path.split('/');
  const targetSegments = raw.split('/');
  const result = [
    ...baseSegments,
  ];
  for (const segment of targetSegments) {
    if (segment === '' || segment === '.') {
      continue;
    }
    if (segment === '..') {
      result.pop();
      continue;
    }
    result.push(segment);
  }
  return `/${collectionName}/${result.join('/')}`;
}

function filePathToRoutePath(absolutePath: string, root: string): string {
  const relativePath = relative(root, absolutePath).split(sep).join('/');
  const withoutExtension = relativePath.replace(/\.md$/, '');
  return withoutExtension.replace(/(^|\/)index$/, '');
}

function joinPath(...segments: string[]): string {
  return segments.filter((segment) => segment !== '').join('/');
}

async function walkMarkdownFiles(root: string): Promise<string[]> {
  const paths: string[] = [];
  await discoverMarkdownFiles(root, paths);
  return paths;
}

async function discoverMarkdownFiles(
  directory: string,
  paths: string[],
): Promise<void> {
  let entries: Dirent[];
  try {
    entries = await readdir(directory, {
      withFileTypes: true,
    });
  } catch {
    return;
  }
  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      await discoverMarkdownFiles(fullPath, paths);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.md')) {
      paths.push(fullPath);
    }
  }
}
