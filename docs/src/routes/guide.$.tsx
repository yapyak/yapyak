import { createFileRoute, notFound, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import { Article } from '#components/article';
import { loadGuideArticle } from '#lib/guide';

const loadData = createServerFn()
  .inputValidator((slug: string) => slug)
  .handler(({ data: slug }) => loadGuideArticle(slug));

export const Route = createFileRoute('/guide/$')({
  component: Component,
  async loader({ params }) {
    const slug = params._splat ?? '';
    if (!slug) {
      throw notFound();
    }

    const result = await loadData({ data: slug });

    if (result.kind === 'not-found') {
      throw notFound();
    }
    if (result.kind === 'redirect') {
      throw redirect({ replace: true, to: result.target });
    }
    return { page: result.page };
  },
});

function Component() {
  const { page } = Route.useLoaderData();
  return <Article page={page} />;
}
