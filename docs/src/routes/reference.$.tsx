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
import { findAdjacent } from '#lib/navigation';
import { loadReferencePage } from '#lib/reference';

const referenceRouteApi = getRouteApi('/reference');

const loadData = createServerFn()
  .inputValidator((path: string) => path)
  .handler(({ data: path }) => loadReferencePage(path));

export const Route = createFileRoute('/reference/$')({
  component: Component,
  async loader({ context, params }) {
    const path = params._splat ?? '';
    if (!path) {
      throw notFound();
    }
    const result = await loadData({ data: path });
    if (result.kind === 'not-found') {
      throw notFound();
    }
    if (result.kind === 'redirect') {
      throw redirect({
        params: { _splat: result.target },
        replace: true,
        to: '/reference/$',
      });
    }
    const { next, previous } = findAdjacent(
      context.sidebar,
      `/reference/${path}`,
    );
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
