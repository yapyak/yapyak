import { parseMarkdoc } from '#lib/markdoc';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function loadReferenceIntroduction() {
  const path = join(process.cwd(), 'content', 'reference', 'introduction.md');
  const source = await readFile(path, 'utf8');
  const { frontmatter, tree } = parseMarkdoc(source);
  return {
    description: (frontmatter.description as string | undefined) ?? '',
    title: (frontmatter.title as string | undefined) ?? 'Reference',
    tree,
  };
}
