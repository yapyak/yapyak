import { createFileRoute, getRouteApi, notFound } from '@tanstack/react-router';

import { ContentLayout } from '#components/content-layout';
import { ContentNavigation } from '#components/content-navigation';
import { PageArticle } from '#components/page-article';

import { doc } from 'virtual:doc-extractor';

const referenceRouteApi = getRouteApi('/reference');

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
  const { sidebar } = referenceRouteApi.useRouteContext();
  return (
    <>
      <PageArticle
        nextPage={nextPage}
        page={page}
        previousPage={previousPage}
      />
      <ContentLayout.Toolbar
        nextPage={nextPage}
        previousPage={previousPage}
      >
        <ContentNavigation
          aria-label="Reference navigation"
          tree={sidebar}
        />
      </ContentLayout.Toolbar>
    </>
  );
}
