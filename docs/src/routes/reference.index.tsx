import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import { Article } from '#components/article';
import { loadReferenceIntroduction } from '#lib/reference';

const loadData = createServerFn().handler(() => loadReferenceIntroduction());

export const Route = createFileRoute('/reference/')({
  component: Component,
  async loader() {
    const page = await loadData();
    return { page };
  },
});

function Component() {
  const { page } = Route.useLoaderData();
  return <Article page={page} />;
}
