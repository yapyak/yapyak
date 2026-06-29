import type { EyebrowBlock, Page } from '@yapyak/doc-compiler';

import { createFileRoute } from '@tanstack/react-router';

import { PageArticle } from '#components/page-article';
import { loadPage } from '#utils/load-page';

type LoaderData = {
  page: Page;
};

type HeadContext = {
  loaderData?: LoaderData;
};

export const Route = createFileRoute('/reference/$')({
  component: Component,
  head({ loaderData }: HeadContext) {
    if (loaderData === undefined) {
      return {};
    }
    const { page } = loaderData;
    const eyebrow = page.blocks.find(
      (block): block is EyebrowBlock => block.kind === 'eyebrow',
    );
    const module = eyebrow?.module;
    const hideModule = module == null || module === page.title;
    const title = hideModule
      ? `${page.title} - yapyak`
      : `${page.title} - ${module} - yapyak`;
    return {
      meta: [
        {
          title,
        },
      ],
    };
  },
  loader({ params }) {
    return loadPage('reference', params._splat ?? '');
  },
});

function Component() {
  const { page } = Route.useLoaderData();

  return <PageArticle page={page} />;
}
