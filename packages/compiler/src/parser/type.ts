import type { SourceMap } from 'magic-string';
import type * as ts from 'typescript';

export type Framework = 'astro' | 'svelte' | 'vanilla' | 'vue';

export type DiagnosticCode =
  | 'YPK001'
  | 'YPK002'
  | 'YPK003'
  | 'YPK005'
  | 'YPK007'
  | 'YPK008';

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

export interface YapyakBinding {
  declarationNode: ts.Node;
  kind: 'direct' | 'namespace' | 'wrapper';
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
  fileId: string;
  range: Range;
}

export interface ExtractedMessage {
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
  optionsExpression?: string;
  params?: ParsedParams;
  source: string;
  sourceRange: Range;
}

export interface ScriptBlock {
  code: string;
  lang: 'js' | 'ts';
  offsetInSource: number;
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
