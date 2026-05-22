import { createFileRoute, notFound, redirect } from '@tanstack/react-router';

import { PageArticle } from '#components/page-article';

import { doc } from 'virtual:doc-extractor';

export const Route = createFileRoute('/guide/$')({
  component: Component,
  loader({ params }) {
    const splat = params._splat;
    if (!splat) {
      throw notFound();
    }

    const result = doc.resolvePath('guide', splat);

    if (result.kind === 'not-found') {
      throw notFound();
    }
    if (result.kind === 'redirect') {
      throw redirect({ replace: true, to: result.target });
    }

    return { page: result.page };
  },
});

function Component() {
  const { page } = Route.useLoaderData();

  return <PageArticle page={page} />;
}
