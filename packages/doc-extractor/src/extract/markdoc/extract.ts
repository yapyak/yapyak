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
    const redirectTarget = pageRedirectTarget(page, path, collectionName);
    if (redirectTarget !== null) {
      redirects.set(path, redirectTarget);
      continue;
    }
    pages.set(path, page);
  }
  return { pages, redirects, watchedFiles: files };
}

export async function loadMarkdocPage(
  absolutePath: string,
  href: string,
): Promise<Page | null> {
  const source = await readFile(absolutePath, 'utf8').catch(() => null);
  if (source === null) {
    return null;
  }
  const { blocks, frontmatter } = parseMarkdoc(source);
  return {
    blocks,
    description: (frontmatter.description as string | undefined) ?? '',
    href,
    meta: frontmatter,
    title: (frontmatter.title as string | undefined) ?? '',
  };
}

function pageRedirectTarget(
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
