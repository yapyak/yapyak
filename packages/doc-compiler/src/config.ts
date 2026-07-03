export type Config = {
  agentArtifact?: AgentArtifactOptions;
  collections: Record<string, CollectionConfig>;
  options?: OptionsRegistry;
  out: string;
  searchData?: SearchDataOptions;
  sourceUrl?: SourceUrlConfig;
  validate?: boolean;
};

type AgentArtifactOptions = {
  description: string;
  instructions: string;
  outDir: string;
  siteName: string;
  siteUrl: string;
};

type SearchDataOptions = {
  fileName: string;
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
  supplements?: Supplement[];
};

export type TypeScriptPackage = {
  collapsible?: boolean;
  expanded?: boolean;
  group?: string;
  name: string;
  root: string;
  subpaths?: string[];
};

export type Supplement = {
  collapsible?: boolean;
  expanded?: boolean;
  label: string;
  root: string;
  slug: string;
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
