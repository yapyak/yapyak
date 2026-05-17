import type { Page } from './types';

import { parseContent } from './parser.server';
import { readFile } from 'node:fs/promises';

export async function loadPage(absolutePath: string) {
  const source = await readFile(absolutePath, 'utf8').catch(() => null);
  if (source === null) {
    return null;
  }
  const { blocks, frontmatter } = parseContent(source);
  const page: Page = {
    blocks,
    description: (frontmatter.description as string | undefined) ?? '',
    title: (frontmatter.title as string | undefined) ?? '',
  };
  return { frontmatter, page };
}
