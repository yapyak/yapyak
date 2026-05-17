import { loadPage } from '#lib/content';

import { join } from 'node:path';

export async function loadReferenceIntroduction() {
  const path = join(process.cwd(), 'content', 'reference', 'introduction.md');
  const result = await loadPage(path);
  if (result === null) {
    throw new Error(`reference introduction missing at ${path}`);
  }
  return { ...result.page, title: result.page.title || 'Reference' };
}
