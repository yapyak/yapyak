import {
  createFileRoute,
  getRouteApi,
  notFound,
  redirect,
} from '@tanstack/react-router';

import { ContentLayout } from '#components/content-layout';
import { ContentNavigation } from '#components/content-navigation';
import { PageArticle } from '#components/page-article';

import { doc } from 'virtual:doc-extractor';

const referenceRouteApi = getRouteApi('/reference');

export const Route = createFileRoute('/reference/$')({
  component: Component,
  loader({ params }) {
    const splat = params._splat;
    if (!params._splat) {
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
