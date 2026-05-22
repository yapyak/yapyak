import type { Entry, Page } from '@yapyak/doc-extractor';

import { notFound, redirect } from '@tanstack/react-router';

import { doc } from 'virtual:doc-extractor';

export function loadPage(collection: string, path: string): { page: Page } {
  return pageOrThrow(doc.getEntry(collection, path));
}

export function redirectToFirstPage(collection: string): never {
  const first = doc.getFirstPage(collection);
  if (first === null) {
    throw notFound();
  }
  throw redirect({ replace: true, to: first.href });
}

function pageOrThrow(entry: Entry): { page: Page } {
  if (entry.kind === 'page') {
    return { page: entry.page };
  }
  if (entry.kind === 'redirect') {
    throw redirect({ replace: true, to: entry.target });
  }
  throw notFound();
}
