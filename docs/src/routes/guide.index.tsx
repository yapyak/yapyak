import { createFileRoute } from '@tanstack/react-router';

import { PageArticle } from '#components/page-article';
import { loadIndex } from '#utils/load';

export const Route = createFileRoute('/guide/')({
  component: Component,
  loader() {
    return loadIndex('guide');
  },
});

function Component() {
  const { page } = Route.useLoaderData();
  return <PageArticle page={page} />;
}
