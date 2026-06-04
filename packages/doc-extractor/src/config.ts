export interface Config {
  collections: Record<string, CollectionConfig>;
  options?: OptionsRegistry;
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

export type OptionsRegistry = Record<string, OptionsGroup>;

export interface OptionsGroup {
  default: string;
  label: string;
  options: OptionItem[];
}

export interface OptionItem {
  icon?: string;
  label: string;
  value: string;
}
