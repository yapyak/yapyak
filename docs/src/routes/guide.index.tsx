import { createFileRoute } from '@tanstack/react-router';

import { PageArticle } from '#components/page-article';
import { loadPage } from '#utils/load-page';

export const Route = createFileRoute('/guide/')({
  component: Component,
  loader() {
    return loadPage('guide');
  },
});

function Component() {
  const { page } = Route.useLoaderData();
  return <PageArticle page={page} />;
}
