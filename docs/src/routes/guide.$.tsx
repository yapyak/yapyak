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

const guideRouteApi = getRouteApi('/guide');

export const Route = createFileRoute('/guide/$')({
  component: Component,
  loader({ params }) {
    const splat = params._splat;
    if (!splat) {
      throw notFound();
    }

    const result = doc.resolvePath('guide', splat);

    if (result.kind === 'not-found') {
      throw notFound();
    }
    if (result.kind === 'redirect') {
      throw redirect({ replace: true, to: result.target });
    }

    const { nextPage, previousPage } = doc.findAdjacentPages(result.page);

    return {
      nextPage,
      page: result.page,
      previousPage,
    };
  },
});

function Component() {
  const { page, previousPage, nextPage } = Route.useLoaderData();
  const { sidebar } = guideRouteApi.useRouteContext();
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
          aria-label="Guide navigation"
          tree={sidebar}
        />
      </ContentLayout.Toolbar>
    </>
  );
}
