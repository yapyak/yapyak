import type { Page } from './types';

import { parseMarkdoc } from './parser.server';
import { readFile } from 'node:fs/promises';

export async function loadMarkdocPage(absolutePath: string) {
  const source = await readFile(absolutePath, 'utf8').catch(() => null);
  if (source === null) {
    return null;
  }
  const { frontmatter, tree } = parseMarkdoc(source);
  const page: Page = {
    description: (frontmatter.description as string | undefined) ?? '',
    title: (frontmatter.title as string | undefined) ?? '',
    tree,
  };
  return { frontmatter, page };
}
