import type { MarkdocNode } from '#lib/markdoc';

import { createServerFn } from '@tanstack/react-start';

export interface ReferenceIntroduction {
  description: string;
  title: string;
  tree: MarkdocNode[];
}

export const loadReferenceIntroduction = createServerFn().handler(
  async (): Promise<ReferenceIntroduction> => {
    const { readFile } = await import('node:fs/promises');
    const { join } = await import('node:path');
    const { parseMarkdoc } = await import('#lib/markdoc');
    const path = join(process.cwd(), 'content', 'reference', 'introduction.md');
    const source = await readFile(path, 'utf8');
    const { frontmatter, tree } = parseMarkdoc(source);
    return {
      description: (frontmatter.description as string | undefined) ?? '',
      title: (frontmatter.title as string | undefined) ?? 'Reference',
      tree,
    };
  },
);
