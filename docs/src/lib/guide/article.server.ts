import { loadPage } from '#lib/content';

import { join } from 'node:path';

export async function loadGuideArticle(slug: string) {
  const candidates = [
    join(process.cwd(), 'content', 'guide', `${slug}.md`),
    join(process.cwd(), 'content', 'guide', slug, 'index.md'),
  ];
  for (const path of candidates) {
    const result = await loadPage(path);
    if (result === null) {
      continue;
    }
    const { frontmatter, page } = result;
    const redirectField = frontmatter.redirect;
    if (typeof redirectField === 'string' && redirectField) {
      const target = resolveRedirect(slug, redirectField);
      if (target !== `/guide/${slug}`) {
        return { kind: 'redirect' as const, target };
      }
    }
    return {
      kind: 'article' as const,
      page: { ...page, title: page.title || slug },
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
