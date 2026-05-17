import type { MarkdocNode } from '#lib/markdoc';

export interface Article {
  description: string;
  title: string;
  tree: MarkdocNode[];
}
