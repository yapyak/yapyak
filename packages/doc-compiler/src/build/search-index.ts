import type { Manifest, Page, SidebarNode } from './manifest';

import { blockToText } from '../access';

export type SearchIndexEntry = {
  body: string;
  breadcrumb: string[];
  collection: string;
  href: string;
  kind: 'heading' | 'page';
  title: string;
};

export type SearchIndex = {
  entries: SearchIndexEntry[];
  version: 1;
};

export function buildSearchIndex(manifest: Manifest): SearchIndex {
  const entries: SearchIndexEntry[] = [];
  for (const [collectionName, collection] of Object.entries(
    manifest.collections,
  )) {
    const breadcrumbByHref = buildBreadcrumbs(collection.sidebar);
    for (const page of Object.values(collection.pages)) {
      const breadcrumb = breadcrumbByHref.get(page.href) ?? [];
      const { intro, sections } = splitSections(page);
      entries.push({
        body: intro,
        breadcrumb,
        collection: collectionName,
        href: page.href,
        kind: 'page',
        title: page.title,
      });
      for (const section of sections) {
        entries.push({
          body: section.body,
          breadcrumb: [
            ...breadcrumb,
            page.title,
          ],
          collection: collectionName,
          href: `${page.href}#${section.id}`,
          kind: 'heading',
          title: section.text,
        });
      }
    }
  }
  return {
    entries,
    version: 1,
  };
}

function buildBreadcrumbs(sidebar: SidebarNode[]): Map<string, string[]> {
  const breadcrumbByHref = new Map<string, string[]>();
  const walk = (nodes: SidebarNode[], trail: string[]): void => {
    for (const node of nodes) {
      if (node.kind === 'link') {
        breadcrumbByHref.set(node.href, trail);
        continue;
      }
      if (node.href !== undefined) {
        breadcrumbByHref.set(node.href, trail);
      }
      walk(node.children, [
        ...trail,
        node.label,
      ]);
    }
  };
  walk(sidebar, []);
  return breadcrumbByHref;
}

type Section = {
  body: string;
  id: string;
  text: string;
};

const SECTION_MIN_LEVEL = 2;
const SECTION_MAX_LEVEL = 3;

function splitSections(page: Page): {
  intro: string;
  sections: Section[];
} {
  const sections: Section[] = [];
  const introParts: string[] = [];
  let current:
    | {
        id: string;
        parts: string[];
        text: string;
      }
    | undefined;

  const flush = (): void => {
    if (current === undefined) {
      return;
    }
    sections.push({
      body: normalize(current.parts.join(' ')),
      id: current.id,
      text: current.text,
    });
  };

  for (const block of page.blocks) {
    if (block.kind === 'heading') {
      if (
        block.level >= SECTION_MIN_LEVEL &&
        block.level <= SECTION_MAX_LEVEL
      ) {
        flush();
        current = {
          id: block.id,
          parts: [],
          text: blockToText(block),
        };
      }
      continue;
    }
    const text = blockToText(block);
    if (text.length === 0) {
      continue;
    }
    if (current === undefined) {
      introParts.push(text);
    } else {
      current.parts.push(text);
    }
  }
  flush();

  return {
    intro: normalize(introParts.join(' ')),
    sections,
  };
}

const MAX_BODY_LENGTH = 1500;

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_BODY_LENGTH);
}
