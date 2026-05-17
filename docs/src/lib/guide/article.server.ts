import { parseMarkdoc } from '#lib/markdoc';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function loadGuideArticle(slug: string) {
  const candidates = [
    join(process.cwd(), 'content', 'guide', `${slug}.md`),
    join(process.cwd(), 'content', 'guide', slug, 'index.md'),
  ];
  for (const path of candidates) {
    const source = await readFile(path, 'utf8').catch(() => null);
    if (source === null) {
      continue;
    }
    const { frontmatter, tree } = parseMarkdoc(source);
    const redirectField = frontmatter.redirect;
    if (typeof redirectField === 'string' && redirectField) {
      const target = resolveRedirect(slug, redirectField);
      if (target !== `/guide/${slug}`) {
        return { kind: 'redirect' as const, target };
      }
    }
    return {
      article: {
        description: (frontmatter.description as string | undefined) ?? '',
        title: (frontmatter.title as string | undefined) ?? slug,
        tree,
      },
      kind: 'article' as const,
    };
  }
  return { kind: 'not-found' as const };
}

function resolveRedirect(fromSlug: string, target: string) {
  if (target.startsWith('/')) {
    return target;
  }
  const fromSegments = fromSlug.split('/').filter(Boolean);
  const targetSegments = target.split('/').filter(Boolean);
  for (const segment of targetSegments) {
    if (segment === '.') {
      continue;
    }
    if (segment === '..') {
      fromSegments.pop();
      continue;
    }
    fromSegments.push(segment);
  }
  return `/guide/${fromSegments.join('/')}`;
}
