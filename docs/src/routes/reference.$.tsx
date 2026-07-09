import { createFileRoute } from '@tanstack/react-router';

import { BlockRenderer } from '#components/block-renderer';
import { PageArticle } from '#components/page-article';
import { loadEntry } from '#lib/entry';
import { getPageTitle } from '#lib/page';

export const Route = createFileRoute('/reference/$')({
  loader({ params }) {
    return loadEntry('reference', params._splat ?? '');
  },
  head({ loaderData }) {
    if (loaderData === undefined) {
      return {};
    }
    const { page } = loaderData;
    return {
      meta: [
        {
          title: getPageTitle(page),
        },
      ],
    };
  },
  component: Component,
});

function Component() {
  const { blocks, page } = Route.useLoaderData();

  return (
    <PageArticle page={page}>
      <BlockRenderer blocks={blocks} />
    </PageArticle>
  );
}
