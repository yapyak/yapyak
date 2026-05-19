import { createFileRoute, notFound, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import { PageArticle } from '#components/page-article';
import { loadReferencePage } from '#lib/reference';

const loadData = createServerFn()
  .inputValidator((path: string) => path)
  .handler(({ data: path }) => loadReferencePage(path));

export const Route = createFileRoute('/reference/$')({
  component: Component,
  async loader({ params }) {
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
    return { page: result.page };
  },
});

function Component() {
  const { page } = Route.useLoaderData();
  return <PageArticle page={page} />;
}
