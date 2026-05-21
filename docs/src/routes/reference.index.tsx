import { createFileRoute, getRouteApi, notFound } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import { ContentLayout } from '#components/content-layout';
import { ContentNavigation } from '#components/content-navigation';
import { ContentPagination } from '#components/content-pagination';
import { PageArticle } from '#components/page-article';
import { findAdjacent } from '#lib/navigation';
import { loadReferencePage } from '#lib/reference';

const referenceRouteApi = getRouteApi('/reference');

const loadData = createServerFn().handler(() => loadReferencePage(''));

export const Route = createFileRoute('/reference/')({
  component: Component,
  async loader({ context }) {
    const result = await loadData();
    if (result.kind !== 'page') {
      throw notFound();
    }
    const { next, previous } = findAdjacent(context.sidebar, '/reference');
    return { next, page: result.page, previous };
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
