import { notFound, redirect } from '@tanstack/react-router';

import { doc } from 'virtual:docs-compiler';

export async function loadEntry(collection: string, path: string) {
  const entry = await doc.getEntry(collection, path);
  if (entry.kind === 'page') {
    return entry;
  }
  if (entry.kind === 'redirect') {
    throw redirect({
      replace: true,
      to: entry.target,
    });
  }
  throw notFound();
}
