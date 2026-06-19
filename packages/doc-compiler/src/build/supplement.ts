import type { Supplement } from '../config';
import type { Page, SidebarGroup, SidebarLink, SymbolEntry } from './manifest';

import { extractMarkdown } from '../extract/markdown';

export type BuildSupplementInput = {
  collectionName: string;
  supplement: Supplement;
};

export type BuildSupplementResult = {
  group: SidebarGroup;
  pages: Map<string, Page>;
  redirects: Map<string, string>;
  symbols: Record<string, SymbolEntry>;
  watchedFiles: string[];
};

export async function buildSupplement(
  input: BuildSupplementInput,
): Promise<BuildSupplementResult> {
  const { collectionName, supplement } = input;
  const pathPrefix = supplement.slug;
  const indexHref = `/${collectionName}/${pathPrefix}`;

  const { pages, redirects, watchedFiles } = await extractMarkdown(
    supplement.root,
    collectionName,
    pathPrefix,
  );

  const links: {
    node: SidebarLink;
    order: number;
    slug: string;
  }[] = [];
  const symbols: Record<string, SymbolEntry> = {};

  for (const [pagePath, page] of pages) {
    if (pagePath === pathPrefix) {
      continue;
    }
    const slug = pagePath.slice(pathPrefix.length + 1);
    if (slug.includes('/')) {
      continue;
    }
    const label = typeof page.meta.title === 'string' ? page.meta.title : slug;
    const order =
      typeof page.meta.order === 'number'
        ? page.meta.order
        : Number.POSITIVE_INFINITY;
    links.push({
      node: {
        href: page.href,
        label,
        type: 'link',
      },
      order,
      slug,
    });
    symbols[`${pathPrefix}/${slug}`] = {
      collection: collectionName,
      path: pagePath,
    };
  }

  links.sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    return a.slug.localeCompare(b.slug);
  });

  const collapsible = supplement.collapsible ?? false;
  const hasIndex = pages.has(pathPrefix);

  return {
    group: {
      children: links.map((link) => link.node),
      collapsible,
      label: supplement.label,
      type: 'group',
      ...(hasIndex && {
        href: indexHref,
      }),
      ...(collapsible && {
        defaultOpen: supplement.expanded ?? false,
      }),
    },
    pages,
    redirects,
    symbols,
    watchedFiles,
  };
}
