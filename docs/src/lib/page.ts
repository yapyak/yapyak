import type { Entry, Page } from '@yapyak/doc-compiler';

import { notFound, redirect } from '@tanstack/react-router';

import { doc } from 'virtual:doc-compiler';

const BRAND = 'yapyak';

export async function loadPage(collection: string, path: string) {
  return pageOrThrow(await doc.getEntry(collection, path));
}

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
  const firstPageMeta = doc.getFirstPageMeta(collection);
  if (firstPageMeta === undefined) {
    throw notFound();
  }
  throw redirect({
    replace: true,
    to: firstPageMeta.href,
  });
}

function pageOrThrow(entry: Entry): {
  page: Page;
} {
  if (entry.kind === 'page') {
    return {
      page: entry.page,
    };
  }
  if (entry.kind === 'redirect') {
    throw redirect({
      replace: true,
      to: entry.target,
    });
  }
  throw notFound();
}
