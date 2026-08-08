import { createFileRoute } from '@tanstack/react-router';

import { BlockRenderer } from '#components/block-renderer';
import { PageArticle } from '#components/page-article';
import { loadEntry } from '#lib/entry';
import { getPageTitle } from '#lib/page';

export const Route = createFileRoute('/guide/$')({
  async loader({ params }) {
    const entry = await loadEntry('guide', params._splat ?? '');
    return {
      blocks: entry.blocks,
      page: entry.page,
    };
  },
  head({ loaderData }) {
    if (loaderData === undefined) {
      return {};
    }
    const { page } = loaderData;
    return {
      links: [
        {
          href: page.href,
          rel: 'canonical',
        },
      ],
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
