import { createFileRoute, getRouteApi, notFound } from '@tanstack/react-router';

import { ContentLayout } from '#components/content-layout';
import { ContentNavigation } from '#components/content-navigation';
import { ContentPagination } from '#components/content-pagination';
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
    const { next, previous } = doc.findAdjacentPages(page);
    return { next, page, previous };
  },
});

function Component() {
  const { page, previous, next } = Route.useLoaderData();
  const { sidebar } = referenceRouteApi.useRouteContext();
  return (
    <>
      <PageArticle page={page} />
      <ContentPagination
        next={next}
        previous={previous}
      />
      <ContentLayout.Toolbar
        next={next}
        previous={previous}
      >
        <ContentNavigation
          aria-label="Reference navigation"
          tree={sidebar}
        />
      </ContentLayout.Toolbar>
    </>
  );
}
