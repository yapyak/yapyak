import { createFileRoute } from '@tanstack/react-router';

import { PageArticle } from '#components/page-article';
import { loadPage } from '#utils/load-page';

export const Route = createFileRoute('/guide/$')({
  component: Component,
  loader({ params }) {
    return loadPage('guide', params._splat ?? '');
  },
});

function Component() {
  const { page } = Route.useLoaderData();

  return <PageArticle page={page} />;
}
