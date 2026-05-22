import { createFileRoute, notFound } from '@tanstack/react-router';

import { PageArticle } from '#components/page-article';

import { doc } from 'virtual:doc-extractor';

export const Route = createFileRoute('/reference/')({
  component: Component,
  loader() {
    const page = doc.getPage('reference');
    if (page === null) {
      throw notFound();
    }
    const { nextPage, previousPage } = doc.findAdjacentPages(page);
    return { nextPage, page, previousPage };
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
