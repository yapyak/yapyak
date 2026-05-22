import type { Entry, Page } from '@yapyak/doc-extractor';

import { notFound, redirect } from '@tanstack/react-router';

import { doc } from 'virtual:doc-extractor';

export function loadPage(collection: string, path?: string) {
  if (path === undefined) {
    const entry = doc.getEntry(collection, '');
    if (entry.kind === 'not-found') {
      const first = doc.getFirstPage(collection);
      if (first === null) {
        throw notFound();
      }
      throw redirect({ replace: true, to: first.href });
    }
    return pageOrThrow(entry);
  }
  return pageOrThrow(doc.getEntry(collection, path));
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
