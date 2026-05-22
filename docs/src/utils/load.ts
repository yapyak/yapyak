import type { LoadResult, Page } from '@yapyak/doc-extractor';

import { notFound, redirect } from '@tanstack/react-router';

import { doc } from 'virtual:doc-extractor';

export function pageOrThrow(result: LoadResult): { page: Page } {
  if (result.kind === 'page') {
    return { page: result.page };
  }
  if (result.kind === 'redirect') {
    throw redirect({ replace: true, to: result.target });
  }
  throw notFound();
}

export function loadPage(collection: string, path: string | undefined) {
  if (path === undefined) {
    throw notFound();
  }
  return pageOrThrow(doc.resolvePath(collection, path));
}

export function loadIndex(collection: string) {
  const result = doc.resolvePath(collection);
  if (result.kind !== 'not-found') {
    return pageOrThrow(result);
  }
  const first = doc.getFirstPage(collection);
  if (first === null) {
    throw notFound();
  }
  throw redirect({ replace: true, to: first.href });
}
