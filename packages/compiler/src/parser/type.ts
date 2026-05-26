import type MagicString from 'magic-string';
import type { SourceMap } from 'magic-string';
import type * as ts from 'typescript';

export type ProcessorKind = 'astro' | 'svelte' | 'vanilla' | 'vue';

export type DiagnosticCode =
  | 'YPK001'
  | 'YPK002'
  | 'YPK003'
  | 'YPK005'
  | 'YPK007'
  | 'YPK008';

/**
 * Position in a source file. Used in diagnostics, call-site ranges, and locale-file location metadata. Renaming or removing fields is a breaking change.
 */
export interface Position {
  column: number;
  line: number;
  offset: number;
}

/**
 * Range in a source file. Same stability contract as {@link Position}.
 */
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

export interface Binding {
  declarationNode: ts.Node;
  kind: 'direct' | 'namespace' | 'wrapper';
  localName: string;
}

export interface Scope {
  bindings: Map<string, Binding>;
  node: ts.Node;
  parent?: Scope;
}

export interface BindingTable {
  find(name: string, atNode: ts.Node): Binding | undefined;
  root: Scope;
}

/**
 * A discovered `$t()` call site. The `node` field is intentionally a `ts.CallExpression` (not a stable shape) and may only be inspected, never serialized — consumers that need to cross process boundaries should rely on `range` instead.
 */
export interface CallSite {
  binding: Binding;
  elision?: ElisionContext;
  node: ts.CallExpression;
  range: Range;
}

export interface ElisionContext {
  attrName?: string;
  mode: 'attribute' | 'text';
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

/**
 * Location of a single `$t()` call. Multiple locations may belong to the same {@link ExtractedMessage} when the same source string appears in multiple files. Serialized to the cloud and to locale-file sidecar metadata.
 */
export interface Location {
  callSiteContext: CallSiteContext;
  fileId: string;
  range: Range;
}

/**
 * A unique source string extracted from `$t()` calls. The `id` is a stable hash (see `toMessageId`) used as the catalog key. Renaming or removing fields is a breaking change.
 */
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

/**
 * A logically-isolated unit of code extracted from a source file by a {@link Processor}. Scripts are full JS/TS modules; template-expressions are single expressions (e.g. a Vue mustache, a Svelte `{...}` tag, an Astro `{...}` interpolation). `originalOffset` enables source-map-preserving back-mapping. Returned by processor implementations and consumed by the compiler. Renaming/removing fields is a breaking change for every framework processor.
 */
export interface Fragment {
  code: string;
  /**
   * When set, the entire fragment expression sits in a template position
   * (e.g. a Vue mustache, a Svelte `{...}`, an Astro `{...}`, a JSX child or
   * attribute) where a bare string literal can replace the surrounding
   * wrappers. Used by the transform to elide call wrappers in single-locale
   * mode. Range is relative to the original source.
   */
  elision?: ElisionContext;
  kind: 'script' | 'template-expression';
  lang: 'js' | 'ts';
  originalOffset: number;
}

/**
 * Framework-specific source processor. Documented public extension point: implement `parseFragments` and `applyImport` to add support for a new framework or template language. Renaming or changing either method signature is a breaking change. Adding optional methods (with defaults) is allowed.
 */
export interface Processor {
  applyImport(
    magicString: MagicString,
    source: string,
    importStatement: string,
  ): void;
  parseFragments(source: string): Fragment[];
}

export interface ExtractFileRequest {
  fileId: string;
  locales: readonly string[];
  processor?: ProcessorKind;
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
  locales: readonly string[];
  processor?: ProcessorKind;
  source: string;
  translations: Record<string, Record<string, string>>;
}

export interface TransformFileResult {
  code: string;
  diagnostics: Diagnostic[];
  map: SourceMap;
}
