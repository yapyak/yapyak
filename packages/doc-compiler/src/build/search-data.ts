import type { Block } from '../access';
import type { Manifest } from './manifest';

import { blockToText } from '../access';

export type SearchEntry = {
  body: string;
  breadcrumbs: string[];
  collection: string;
  href: string;
  kind: 'heading' | 'page';
  title: string;
};

export type SearchData = {
  entries: SearchEntry[];
  version: 1;
};

export function buildSearchData(manifest: Manifest): SearchData {
  const entries: SearchEntry[] = [];
  for (const [collectionName, collection] of Object.entries(
    manifest.collections,
  )) {
    for (const [path, page] of Object.entries(collection.pages)) {
      const breadcrumbs = page.breadcrumbs;
      const { intro, sections } = splitSections(collection.content[path] ?? []);
      entries.push({
        body: intro,
        breadcrumbs,
        collection: collectionName,
        href: page.href,
        kind: 'page',
        title: page.title,
      });
      for (const section of sections) {
        entries.push({
          body: section.body,
          breadcrumbs: [
            ...breadcrumbs,
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

type Section = {
  body: string;
  id: string;
  text: string;
};

const SECTION_MIN_LEVEL = 2;
const SECTION_MAX_LEVEL = 3;

function splitSections(blocks: Block[]): {
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

  for (const block of blocks) {
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
