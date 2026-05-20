import type { Page } from '#lib/content';

import { loadPage } from '#lib/content';

import { loadManifest } from './manifest.server';
import { buildSymbolPage } from './pages.server';
import { join } from 'node:path';

export type LoadReferenceResult =
  | { kind: 'not-found' }
  | { kind: 'page'; page: Page }
  | { kind: 'redirect'; target: string };

export async function loadReferencePage(
  path: string,
): Promise<LoadReferenceResult> {
  if (path === '') {
    const introPath = join(
      process.cwd(),
      'content',
      'reference',
      'introduction.md',
    );
    const result = await loadPage(introPath);
    if (result === null) {
      return { kind: 'not-found' };
    }
    return {
      kind: 'page',
      page: { ...result.page, title: result.page.title || 'Reference' },
    };
  }

  const manifest = await loadManifest(process.cwd());

  const moduleId = slugToModuleId(path);
  const moduleMatch = manifest.modules.find((module) => module.id === moduleId);
  if (moduleMatch !== undefined) {
    const firstExport = moduleMatch.exports[0];
    if (firstExport === undefined) {
      return { kind: 'not-found' };
    }
    const isRoot = moduleMatch.id === 'yapyak';
    const slug = moduleSlug(moduleMatch.id);
    return {
      kind: 'redirect',
      target: isRoot ? firstExport.name : `${slug}/${firstExport.name}`,
    };
  }

  const lastSlash = path.lastIndexOf('/');
  const parentSlug = lastSlash === -1 ? '' : path.slice(0, lastSlash);
  const symbolName = lastSlash === -1 ? path : path.slice(lastSlash + 1);
  const parentId = slugToModuleId(parentSlug);
  const parent = manifest.modules.find((module) => module.id === parentId);
  if (parent === undefined) {
    return { kind: 'not-found' };
  }
  const symbol = parent.exports.find((entry) => entry.name === symbolName);
  if (symbol === undefined) {
    return { kind: 'not-found' };
  }

  return { kind: 'page', page: buildSymbolPage(symbol, parent.id) };
}

function slugToModuleId(slug: string) {
  if (slug === '' || slug === 'yapyak') {
    return 'yapyak';
  }
  return `yapyak/${slug}`;
}

function moduleSlug(id: string) {
  const trimmed = id.replace(/^yapyak\/?/, '');
  return trimmed === '' ? 'yapyak' : trimmed;
}
