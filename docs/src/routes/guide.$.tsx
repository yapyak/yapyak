import {
  createFileRoute,
  getRouteApi,
  notFound,
  redirect,
} from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import { ContentLayout } from '#components/content-layout';
import { ContentNavigation } from '#components/content-navigation';
import { ContentPagination } from '#components/content-pagination';
import { PageArticle } from '#components/page-article';
import { loadGuideArticle } from '#lib/guide';
import { findAdjacent } from '#lib/navigation';

const guideRouteApi = getRouteApi('/guide');

const loadData = createServerFn()
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    return loadGuideArticle(slug);
  });

export const Route = createFileRoute('/guide/$')({
  component: Component,
  async loader({ context, params }) {
    const slug = params._splat ?? '';
    if (!slug) {
      throw notFound();
    }

    const result = await loadData({ data: slug });

    if (result.kind === 'not-found') {
      throw notFound();
    }
    if (result.kind === 'redirect') {
      throw redirect({ replace: true, to: result.target });
    }

    const { next, previous } = findAdjacent(context.sidebar, `/guide/${slug}`);

    return {
      next,
      page: result.page,
      previous,
    };
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
