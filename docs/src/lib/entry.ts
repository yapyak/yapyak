import type { Block, Entry, Page } from '@yapyak/doc-compiler';

import { notFound, redirect } from '@tanstack/react-router';

import { doc } from 'virtual:doc-compiler';

export async function loadEntry(collection: string, path: string) {
  return pageOrThrow(await doc.getEntry(collection, path));
}

function pageOrThrow(entry: Entry): {
  blocks: Block[];
  page: Page;
} {
  if (entry.kind === 'page') {
    return {
      blocks: entry.blocks,
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
