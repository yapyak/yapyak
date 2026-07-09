import type { Page } from '@yapyak/doc-compiler';

import { notFound, redirect } from '@tanstack/react-router';

import { doc } from 'virtual:doc-compiler';

const BRAND = 'yapyak';

export function getPageTitle(page: Page) {
  const qualifier = page.breadcrumbs.at(-1);
  if (
    qualifier === undefined ||
    qualifier === '' ||
    qualifier === page.title ||
    qualifier === BRAND
  ) {
    return `${page.title} - ${BRAND}`;
  }

  return `${page.title} - ${qualifier} - ${BRAND}`;
}

export function redirectToFirstPage(collection: string): never {
  const firstPage = doc.getFirstPage(collection);
  if (firstPage === undefined) {
    throw notFound();
  }
  throw redirect({
    replace: true,
    to: firstPage.href,
  });
}
