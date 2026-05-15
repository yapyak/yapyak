import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import type { ReactElement } from 'react';
import { Article } from '#components/article';

const loadIntroduction = createServerFn({ method: 'GET' }).handler(async () => {
  const { readFile } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const { renderMarkdown } = await import('#lib/markdown');
  const path = join(process.cwd(), 'content', 'reference', 'introduction.md');
  const source = await readFile(path, 'utf8');
  const { frontmatter, html } = await renderMarkdown(source);
  return {
    title: (frontmatter.title as string | undefined) ?? 'Reference',
    description: (frontmatter.description as string | undefined) ?? '',
    html,
  };
});

export const Route = createFileRoute('/reference/')({
  async loader() {
    const introduction = await loadIntroduction();
    return { introduction };
  },
  component: Component,
});

function Component(): ReactElement {
  const { introduction } = Route.useLoaderData();
  return (
    <Article>
      <Article.Header
        title={introduction.title}
        description={introduction.description}
      />
      <Article.Body html={introduction.html} />
    </Article>
  );
}
