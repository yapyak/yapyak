import { loadMarkdocPage } from '#lib/markdoc';

import { join } from 'node:path';

export async function loadReferenceIntroduction() {
  const path = join(process.cwd(), 'content', 'reference', 'introduction.md');
  const result = await loadMarkdocPage(path);
  if (result === null) {
    throw new Error(`reference introduction missing at ${path}`);
  }
  return { ...result.page, title: result.page.title || 'Reference' };
}
