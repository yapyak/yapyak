import type { ReactElement } from 'react';

import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import { Article } from '#components/article';

const loadIntroduction = createServerFn({ method: 'GET' }).handler(async () => {
  const { readFile } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const { renderMarkdown } = await import('#lib/markdown');
  const path = join(process.cwd(), 'content', 'reference', 'introduction.md');
  const source = await readFile(path, 'utf8');
  const { frontmatter, html } = await renderMarkdown(source);
  return {
    description: (frontmatter.description as string | undefined) ?? '',
    html,
    title: (frontmatter.title as string | undefined) ?? 'Reference',
  };
});

export const Route = createFileRoute('/reference/')({
  component: Component,
  async loader() {
    const introduction = await loadIntroduction();
    return { introduction };
  },
});

function Component(): ReactElement {
  const { introduction } = Route.useLoaderData();
  return (
    <Article>
      <Article.Header
        description={introduction.description}
        title={introduction.title}
      />
      <Article.Body html={introduction.html} />
    </Article>
  );
}
