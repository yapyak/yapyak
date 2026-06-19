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

export type CollectionConfig = MarkdownSource | TypeScriptSource;

export type MarkdownSource = {
  root: string;
  source: 'markdown';
};

export type TypeScriptSource = {
  packages: TypeScriptPackage[];
  source: 'typescript';
};

export type TypeScriptPackage = {
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
