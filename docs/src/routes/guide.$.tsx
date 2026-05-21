import {
  createFileRoute,
  getRouteApi,
  notFound,
  redirect,
} from '@tanstack/react-router';
import { findAdjacentPages, resolvePath } from '@yapyak/doc-extractor';

import { ContentLayout } from '#components/content-layout';
import { ContentNavigation } from '#components/content-navigation';
import { ContentPagination } from '#components/content-pagination';
import { PageArticle } from '#components/page-article';
import { manifest } from '#lib/manifest';

const guideRouteApi = getRouteApi('/guide');

export const Route = createFileRoute('/guide/$')({
  component: Component,
  loader({ params }) {
    const slug = params._splat ?? '';
    if (!slug) {
      throw notFound();
    }

    const result = resolvePath(manifest, 'guide', slug);

    if (result.kind === 'not-found') {
      throw notFound();
    }
    if (result.kind === 'redirect') {
      throw redirect({ replace: true, to: result.target });
    }

    const { next, previous } = findAdjacentPages(
      manifest,
      'guide',
      `/guide/${slug}`,
    );

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
