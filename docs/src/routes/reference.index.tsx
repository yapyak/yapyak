import { createFileRoute, notFound } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import { Article } from '#components/article';
import { loadReferencePage } from '#lib/reference';

const loadData = createServerFn().handler(() => loadReferencePage(''));

export const Route = createFileRoute('/reference/')({
  component: Component,
  async loader() {
    const result = await loadData();
    if (result.kind !== 'page') {
      throw notFound();
    }
    return { page: result.page };
  },
});

function Component() {
  const { page } = Route.useLoaderData();
  return <Article page={page} />;
}
