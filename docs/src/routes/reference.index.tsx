import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import { Article } from '#components/article';
import { loadReferenceIntroduction } from '#lib/reference';

const loadData = createServerFn().handler(() => loadReferenceIntroduction());

export const Route = createFileRoute('/reference/')({
  component: Component,
  async loader() {
    const introduction = await loadData();
    return { introduction };
  },
});

function Component() {
  const { introduction } = Route.useLoaderData();
  return (
    <Article>
      <Article.Header
        description={introduction.description}
        title={introduction.title}
      />
      <Article.Body tree={introduction.tree} />
    </Article>
  );
}
