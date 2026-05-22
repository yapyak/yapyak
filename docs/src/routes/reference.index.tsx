import { createFileRoute, notFound, redirect } from '@tanstack/react-router';

import { PageArticle } from '#components/page-article';

import { doc } from 'virtual:doc-extractor';

export const Route = createFileRoute('/reference/')({
  component: Component,
  loader() {
    const result = doc.resolvePath('reference');
    if (result.kind === 'page') {
      return { page: result.page };
    }
    if (result.kind === 'redirect') {
      throw redirect({ replace: true, to: result.target });
    }

    const firstPage = doc.getFirstPage('reference');
    if (firstPage === null) {
      throw notFound();
    }
    throw redirect({ replace: true, to: firstPage.href });
  },
});

function Component() {
  const { page } = Route.useLoaderData();
  return <PageArticle page={page} />;
}
