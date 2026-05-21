import { createFileRoute, getRouteApi, notFound } from '@tanstack/react-router';
import { findAdjacentPages, getPage } from '@yapyak/doc-extractor';

import { ContentLayout } from '#components/content-layout';
import { ContentNavigation } from '#components/content-navigation';
import { ContentPagination } from '#components/content-pagination';
import { PageArticle } from '#components/page-article';
import { manifest } from '#lib/manifest';

const referenceRouteApi = getRouteApi('/reference');

export const Route = createFileRoute('/reference/')({
  component: Component,
  loader() {
    const page = getPage(manifest, 'reference', '');
    if (page === null) {
      throw notFound();
    }
    const { next, previous } = findAdjacentPages(
      manifest,
      'reference',
      '/reference',
    );
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
