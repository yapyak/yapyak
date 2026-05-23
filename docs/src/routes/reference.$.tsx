import { createFileRoute } from '@tanstack/react-router';

import { PageArticle } from '#components/page-article';
import { loadPage } from '#utils/load-page';

export const Route = createFileRoute('/reference/$')({
  component: Component,
  loader({ params }) {
    return loadPage('reference', params._splat ?? '');
  },
});

function Component() {
  const { page } = Route.useLoaderData();

  return <PageArticle page={page} />;
}
