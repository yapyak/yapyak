import {
  createFileRoute,
  getRouteApi,
  notFound,
  redirect,
} from '@tanstack/react-router';

import { ContentLayout } from '#components/content-layout';
import { ContentNavigation } from '#components/content-navigation';
import { ContentPagination } from '#components/content-pagination';
import { PageArticle } from '#components/page-article';

import { doc } from 'virtual:doc-extractor';

const referenceRouteApi = getRouteApi('/reference');

export const Route = createFileRoute('/reference/$')({
  component: Component,
  loader({ params }) {
    const path = params._splat;
    if (!path) {
      throw notFound();
    }
    const result = doc.resolvePath('reference', path);
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
  const { sidebar } = referenceRouteApi.useRouteContext();
  return (
    <>
      <PageArticle page={page} />
      <ContentPagination
        nextPage={nextPage}
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
