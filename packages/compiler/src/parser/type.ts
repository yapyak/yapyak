import type { SourceMap } from 'magic-string';
import type * as ts from 'typescript';

export type Framework = 'astro' | 'svelte' | 'vanilla' | 'vue';

export type DiagnosticCode =
  | 'YPK001'
  | 'YPK002'
  | 'YPK003'
  | 'YPK004'
  | 'YPK005'
  | 'YPK006'
  | 'YPK007'
  | 'YPK008'
  | 'YPK009'
  | 'YPK010'
  | 'YPK011';

export interface Position {
  column: number;
  line: number;
  offset: number;
}

export interface Range {
  end: Position;
  start: Position;
}

export interface Diagnostic {
  code: DiagnosticCode;
  fileId: string;
  hint?: string;
  message: string;
  range: Range;
  severity: 'error' | 'warning';
  source: string;
}

export interface StaticOptions {
  context?: string;
  locale?: string;
}

export interface YapyakBinding {
  declarationNode: ts.Node;
  factoryOptions?: StaticOptions;
  kind: 'direct' | 'factory' | 'namespace' | 'wrapper';
  localName: string;
}

export interface Scope {
  bindings: Map<string, YapyakBinding>;
  node: ts.Node;
  parent?: Scope;
}

export interface BindingTable {
  find(name: string, atNode: ts.Node): YapyakBinding | undefined;
  root: Scope;
}

export interface CallSite {
  binding: YapyakBinding;
  node: ts.CallExpression;
  range: Range;
}

export interface CallSiteContext {
  componentName?: string;
  enclosingFunction?: string;
  enclosingHook?: string;
  enclosingJsx?: string;
}

export interface Placeholder {
  kind: 'date' | 'number' | 'plural' | 'select' | 'simple' | 'time';
  name: string;
  variants?: Record<string, string>;
}

export interface Location {
  callSiteContext: CallSiteContext;
  factoryLocale?: string;
  fileId: string;
  range: Range;
}

export interface ExtractedMessage {
  context?: string;
  id: string;
  locations: Location[];
  placeholders: Placeholder[];
  source: string;
}

export interface ParsedParams {
  keys: string[];
  kind: 'spread' | 'static';
  range: Range;
}

export interface ParsedArguments {
  diagnostics: Diagnostic[];
  options?: StaticOptions;
  params?: ParsedParams;
  source: string;
  sourceRange: Range;
}

export interface ExtractFileRequest {
  fileId: string;
  framework?: Framework;
  locales: readonly string[];
  source: string;
}

export interface ExtractFileResult {
  callSites: CallSite[];
  diagnostics: Diagnostic[];
  messages: ExtractedMessage[];
}

export interface TransformFileRequest {
  extracted: ExtractFileResult;
  fileId: string;
  framework?: Framework;
  locales: readonly string[];
  source: string;
  translations: Record<string, Record<string, string>>;
}

export interface TransformFileResult {
  code: string;
  diagnostics: Diagnostic[];
  map: SourceMap;
}
