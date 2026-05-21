import type { Page } from '../../types/manifest.ts';

import { parseMarkdoc } from './parse.ts';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

export interface MarkdocExtractResult {
  pages: Map<string, Page>;
  watchedFiles: string[];
}

export async function extractMarkdoc(
  root: string,
  collectionName: string,
): Promise<MarkdocExtractResult> {
  const files = await walkMarkdownFiles(root);
  const pages = new Map<string, Page>();
  for (const absolutePath of files) {
    const path = filePathToRoutePath(absolutePath, root);
    const href =
      path === '' ? `/${collectionName}` : `/${collectionName}/${path}`;
    const page = await loadMarkdocPage(absolutePath, href);
    if (page === null) {
      continue;
    }
    pages.set(path, page);
  }
  return { pages, watchedFiles: files };
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

function filePathToRoutePath(absolutePath: string, root: string): string {
  const rel = relative(root, absolutePath).split(sep).join('/');
  const withoutExtension = rel.replace(/\.md$/, '');
  return withoutExtension.replace(/\/index$/, '');
}

async function walkMarkdownFiles(root: string): Promise<string[]> {
  const result: string[] = [];
  await collect(root);
  return result;

  async function collect(directory: string) {
    const entries = await readdir(directory, { withFileTypes: true }).catch(
      () => [],
    );
    for (const entry of entries) {
      const full = join(directory, entry.name);
      if (entry.isDirectory()) {
        await collect(full);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith('.md')) {
        result.push(full);
      }
    }
  }
}

export async function pathExists(absolutePath: string): Promise<boolean> {
  return stat(absolutePath)
    .then(() => true)
    .catch(() => false);
}
