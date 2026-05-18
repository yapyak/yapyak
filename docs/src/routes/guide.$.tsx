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
import { GuidePrevNext } from '#components/guide-prev-next';
import { loadGuideArticle, loadGuidePrevNext } from '#lib/guide';

const guideRouteApi = getRouteApi('/guide');

const loadData = createServerFn()
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const result = await loadGuideArticle(slug);
    if (result.kind !== 'article') {
      return result;
    }
    const { previous, next } = await loadGuidePrevNext(slug);
    return { ...result, previous, next };
  });

export const Route = createFileRoute('/guide/$')({
  component: Component,
  async loader({ params }) {
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
    return {
      page: result.page,
      previous: result.previous ?? null,
      next: result.next ?? null,
    };
  },
});

function Component() {
  const { page, previous, next } = Route.useLoaderData();
  const { sidebar } = guideRouteApi.useLoaderData();
  return (
    <>
      <Article page={page} />
      <GuidePrevNext
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
