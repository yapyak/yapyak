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

const guideRouteApi = getRouteApi('/guide');

export const Route = createFileRoute('/guide/$')({
  component: Component,
  loader({ params }) {
    const slug = params._splat ?? '';
    if (!slug) {
      throw notFound();
    }

    const result = doc.resolvePath('guide', slug);

    if (result.kind === 'not-found') {
      throw notFound();
    }
    if (result.kind === 'redirect') {
      throw redirect({ replace: true, to: result.target });
    }

    const { next, previous } = doc.findAdjacentPages(result.page);

    return { next, page: result.page, previous };
  },
});

function Component() {
  const { page, previous, next } = Route.useLoaderData();
  const { sidebar } = guideRouteApi.useRouteContext();
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
          aria-label="Guide navigation"
          tree={sidebar}
        />
      </ContentLayout.Toolbar>
    </>
  );
}
