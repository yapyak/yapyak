import { createFileRoute } from '@tanstack/react-router';

import { Article } from '#components/article';
import { loadReferenceIntroduction } from '#lib/load-reference-introduction';

export const Route = createFileRoute('/reference/')({
  component: Component,
  async loader() {
    const introduction = await loadReferenceIntroduction();
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
