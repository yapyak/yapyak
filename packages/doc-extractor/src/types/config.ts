export interface Config {
  collections: Record<string, CollectionConfig>;
  out: string;
  validate?: boolean;
}

export type CollectionConfig = MarkdocSource | TypedocSource;

export interface MarkdocSource {
  intro?: never;
  root: string;
  source: 'markdoc';
}

export interface TypedocSource {
  intro?: string;
  packageDir: string;
  source: 'typedoc';
}

export type DocExtractorOptions = Config;
