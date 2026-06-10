export type Config = {
  collections: Record<string, CollectionConfig>;
  options?: OptionsRegistry;
  out: string;
  sourceUrl?: SourceUrlConfig;
  validate?: boolean;
};

export type SourceUrlConfig = {
  template: string;
  workspaceRoot: string;
};

export type CollectionConfig = MarkdocSource | TypedocSource;

export type MarkdocSource = {
  root: string;
  source: 'markdoc';
};

export type TypedocSource = {
  packages: TypedocPackage[];
  source: 'typedoc';
};

export type TypedocPackage = {
  collapsible?: boolean;
  expanded?: boolean;
  group?: string;
  name: string;
  root: string;
  subpaths?: string[];
};

export type OptionsRegistry = Record<string, OptionsGroup>;

export type OptionsGroup = {
  default: string;
  label: string;
  options: OptionItem[];
};

export type OptionItem = {
  icon?: string;
  label: string;
  value: string;
};
