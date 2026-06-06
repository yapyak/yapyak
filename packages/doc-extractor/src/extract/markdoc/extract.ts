import type { Block } from '../../access/block';
import type { Page } from '../../build/manifest';

import { parseMarkdoc } from './parse';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

interface MarkdocExtractResult {
  pages: Map<string, Page>;
  redirects: Map<string, string>;
  watchedFiles: string[];
}

export async function extractMarkdoc(
  root: string,
  collectionName: string,
): Promise<MarkdocExtractResult> {
  const files = await walkMarkdownFiles(root);
  const pages = new Map<string, Page>();
  const redirects = new Map<string, string>();
  for (const absolutePath of files) {
    const path = filePathToRoutePath(absolutePath, root);
    const href =
      path === '' ? `/${collectionName}` : `/${collectionName}/${path}`;
    const page = await loadMarkdocPage(absolutePath, href);
    if (page === null) {
      continue;
    }
    const redirectTarget = resolvePageRedirectTarget(page, path, collectionName);
    if (redirectTarget !== null) {
      redirects.set(path, redirectTarget);
      continue;
    }
    pages.set(path, page);
  }
  return { pages, redirects, watchedFiles: files };
}

async function loadMarkdocPage(
  absolutePath: string,
  href: string,
): Promise<Page | null> {
  const source = await readFile(absolutePath, 'utf8').catch(() => null);
  if (source === null) {
    return null;
  }
  const { blocks, frontmatter } = parseMarkdoc(source);
  return {
    blocks: resolveBlocks(blocks, href),
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
  if (block.type === 'link') {
    const { href, kind } = resolveLinkData(block.href, pageHref);
    return {
      ...block,
      children: resolveBlocks(block.children, pageHref),
      href,
      kind,
    };
  }
  if (block.type === 'table') {
    return {
      ...block,
      body: block.body.map(
        (row) => resolveBlock(row, pageHref) as typeof row,
      ),
      head: block.head
        ? (resolveBlock(block.head, pageHref) as typeof block.head)
        : null,
    };
  }
  if (block.type === 'code-group') {
    return {
      ...block,
      tabs: block.tabs.map(
        (tab) => resolveBlock(tab, pageHref) as typeof tab,
      ),
    };
  }
  if (block.type === 'switch') {
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

interface LinkData {
  href: string;
  kind: 'external' | 'internal';
}

function resolveLinkData(href: string, pageHref: string): LinkData {
  if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) {
    return { href, kind: 'external' };
  }
  if (href.startsWith('/')) {
    return { href, kind: 'internal' };
  }
  if (href.startsWith('#')) {
    return { href: `${pageHref}${href}`, kind: 'internal' };
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
  const resolved = segments.filter((s, i) => s || i === 0).join('/') || '/';
  return {
    href: fragment ? `${resolved}#${fragment}` : resolved,
    kind: 'internal',
  };
}

function resolvePageRedirectTarget(
  page: Page,
  path: string,
  collectionName: string,
): string | null {
  const raw = page.meta.redirect;
  if (typeof raw !== 'string' || raw.length === 0) {
    return null;
  }
  if (raw.startsWith('/')) {
    return raw;
  }
  const baseSegments = path === '' ? [] : path.split('/');
  const targetSegments = raw.split('/');
  const result = [...baseSegments];
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
  return withoutExtension.replace(/\/index$/, '');
}

async function walkMarkdownFiles(root: string): Promise<string[]> {
  const paths: string[] = [];
  await collectMarkdownFiles(root, paths);
  return paths;
}

async function collectMarkdownFiles(
  directory: string,
  paths: string[],
): Promise<void> {
  const entries = await readdir(directory, { withFileTypes: true }).catch(
    () => [],
  );
  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      await collectMarkdownFiles(fullPath, paths);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.md')) {
      paths.push(fullPath);
    }
  }
}
