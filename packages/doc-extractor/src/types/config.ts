export interface Config {
  collections: Record<string, CollectionConfig>;
  out: string;
  validate?: boolean;
}

export type CollectionConfig = MarkdocSource | TypedocSource;

export interface MarkdocSource {
  root: string;
  source: 'markdoc';
}

export interface TypedocSource {
  packages: TypedocPackage[];
  source: 'typedoc';
}

export interface TypedocPackage {
  collapsible?: boolean;
  expanded?: boolean;
  group?: string;
  name: string;
  root: string;
}

export type DocExtractorOptions = Config;
