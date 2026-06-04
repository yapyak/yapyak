export interface Config {
  collections: Record<string, CollectionConfig>;
  out: string;
  sourceUrl?: SourceUrlConfig;
  validate?: boolean;
}

export interface SourceUrlConfig {
  template: string;
  workspaceRoot: string;
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
  subpaths?: string[];
}
