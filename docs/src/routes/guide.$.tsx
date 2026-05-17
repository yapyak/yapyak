import { createFileRoute, notFound, redirect } from '@tanstack/react-router';

import { Article } from '#components/article';
import { loadGuideArticle } from '#lib/load-guide-article';

export const Route = createFileRoute('/guide/$')({
  component: Component,
  async loader({ params }) {
    const slug = params._splat ?? '';
    if (slug === '') {
      throw notFound();
    }
    const result = await loadGuideArticle({ data: slug });
    if (result.kind === 'not-found') {
      throw notFound();
    }
    if (result.kind === 'redirect') {
      throw redirect({ replace: true, to: result.target });
    }
    return { article: result.article };
  },
});

function Component() {
  const { article } = Route.useLoaderData();
  return (
    <Article>
      <Article.Header
        description={article.description}
        title={article.title}
      />
      <Article.Body tree={article.tree} />
    </Article>
  );
}
