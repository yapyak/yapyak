import type { Page } from './types';

import { parseContent } from './parser.server';
import { readFile } from 'node:fs/promises';

export async function loadPage(absolutePath: string): Promise<Page | null> {
  const source = await readFile(absolutePath, 'utf8').catch(() => null);
  if (source === null) {
    return null;
  }
  const { blocks, frontmatter } = parseContent(source);
  return {
    blocks,
    description: (frontmatter.description as string | undefined) ?? '',
    meta: frontmatter,
    title: (frontmatter.title as string | undefined) ?? '',
  };
}
