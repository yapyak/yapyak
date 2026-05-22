import { createFileRoute } from '@tanstack/react-router';

import { PageArticle } from '#components/page-article';
import { loadPage } from '#utils/load-page';

export const Route = createFileRoute('/reference/')({
  component: Component,
  loader() {
    return loadPage('reference');
  },
});

function Component() {
  const { page } = Route.useLoaderData();
  return <PageArticle page={page} />;
}
