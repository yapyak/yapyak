import { createFileRoute } from '@tanstack/react-router';

import { PageArticle } from '#components/page-article';
import { loadIndex } from '#utils/load';

export const Route = createFileRoute('/reference/')({
  component: Component,
  loader() {
    return loadIndex('reference');
  },
});

function Component() {
  const { page } = Route.useLoaderData();
  return <PageArticle page={page} />;
}
