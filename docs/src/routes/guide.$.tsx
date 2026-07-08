import type { Page } from '@yapyak/doc-compiler';

import { createFileRoute } from '@tanstack/react-router';

import { PageArticle } from '#components/page-article';
import { getPageTitle, loadPage } from '#lib/page';

type LoaderData = {
  page: Page;
};

type HeadContext = {
  loaderData?: LoaderData;
};

export const Route = createFileRoute('/guide/$')({
  component: Component,
  head({ loaderData }: HeadContext) {
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
  loader({ params }) {
    return loadPage('guide', params._splat ?? '');
  },
});

function Component() {
  const { page } = Route.useLoaderData();

  return <PageArticle page={page} />;
}
