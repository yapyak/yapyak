import {
  createFileRoute,
  getRouteApi,
  notFound,
  redirect,
} from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import { Article } from '#components/article';
import { GuideLayout } from '#components/guide-layout';
import { GuideNavigation } from '#components/guide-navigation';
import { GuidePagination } from '#components/guide-pagination';
import { findAdjacentPages, loadGuideArticle } from '#lib/guide';

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

    const { next, previous } = findAdjacentPages(context.sidebar, slug);

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
      <Article page={page} />
      <GuidePagination
        next={next}
        previous={previous}
      />
      <GuideLayout.Toolbar
        next={next}
        previous={previous}
      >
        <GuideNavigation items={sidebar} />
      </GuideLayout.Toolbar>
    </>
  );
}
