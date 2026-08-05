import type { Block } from '../access';
import type { Supplement } from '../config';
import type {
  Page,
  SidebarGroupNode,
  SidebarLinkNode,
  SymbolEntry,
} from './manifest';

import { extractMarkdown } from '../extract/markdown';

export type BuildSupplementInput = {
  collectionName: string;
  supplement: Supplement;
};

export type BuildSupplementResult = {
  content: Map<string, Block[]>;
  sidebarNode: SidebarGroupNode;
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

  const {
    pages: loadedPages,
    redirects,
    watchedFiles,
  } = await extractMarkdown(supplement.root, collectionName, pathPrefix);

  const content = new Map<string, Block[]>();
  const pages = new Map<string, Page>();
  for (const [pagePath, loadedPage] of loadedPages) {
    content.set(pagePath, loadedPage.blocks);
    pages.set(pagePath, loadedPage.page);
  }

  const links: {
    sidebarNode: SidebarLinkNode;
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
      order,
      sidebarNode: {
        href: page.href,
        kind: 'link',
        label,
      },
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
    content,
    pages,
    redirects,
    sidebarNode: {
      children: links.map((link) => link.sidebarNode),
      collapsible,
      kind: 'group',
      label: supplement.label,
      ...(hasIndex && {
        href: indexHref,
      }),
      ...(collapsible && {
        defaultOpen: supplement.expanded ?? false,
      }),
    },
    symbols,
    watchedFiles,
  };
}
