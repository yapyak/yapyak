import type { Page } from '@yapyak/doc-compiler';

import { createFileRoute } from '@tanstack/react-router';

import { PageArticle } from '#components/page-article';
import { loadPage } from '#utils/load-page';

type LoaderData = {
  page: Page;
};

type HeadContext = {
  loaderData?: LoaderData;
  params: {
    _splat?: string;
  };
};

export const Route = createFileRoute('/guide/$')({
  component: Component,
  head({ loaderData, params }: HeadContext) {
    if (loaderData === undefined) {
      return {};
    }
    const section = deriveSection(params._splat ?? '');
    const title =
      section === ''
        ? `${loaderData.page.title} - yapyak`
        : `${loaderData.page.title} - ${section} - yapyak`;
    return {
      meta: [
        {
          title,
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

function deriveSection(splat: string): string {
  const segments = splat.split('/');
  if (segments.length < 2) {
    return '';
  }
  return humanize(segments[0] ?? '');
}

function humanize(slug: string): string {
  if (slug === '') {
    return '';
  }
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
