import { createFileRoute, notFound, redirect } from '@tanstack/react-router';

import { PageArticle } from '#components/page-article';

import { doc } from 'virtual:doc-extractor';

export const Route = createFileRoute('/reference/$')({
  component: Component,
  loader({ params }) {
    const splat = params._splat;
    if (!splat) {
      throw notFound();
    }
    const result = doc.resolvePath('reference', splat);
    if (result.kind === 'not-found') {
      throw notFound();
    }
    if (result.kind === 'redirect') {
      throw redirect({
        params: { _splat: result.target.replace(/^\/reference\//, '') },
        replace: true,
        to: '/reference/$',
      });
    }
    const { nextPage, previousPage } = doc.findAdjacentPages(result.page);
    return { nextPage, page: result.page, previousPage };
  },
});

function Component() {
  const { page, previousPage, nextPage } = Route.useLoaderData();
  return (
    <PageArticle
      nextPage={nextPage}
      page={page}
      previousPage={previousPage}
    />
  );
}
