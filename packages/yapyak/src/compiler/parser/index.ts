export type { Diagnostic, DiagnosticCode } from './diagnostic';
export type {
  ExtractedMessage,
  ExtractFileOptions,
  ExtractFileResult,
  Location,
} from './file/extract';
export type {
  TransformFileRequest,
  TransformFileResult,
} from './file/transform';

export {
  type ParsedArguments,
  type ParsedParams,
  parseArguments,
} from './argument';
export {
  type Binding,
  type BindingTable,
  type ResolveBindingsOptions,
  resolveBindings,
  type Scope,
} from './binding';
export { type CallSite, discoverCalls } from './call';
export {
  type CallSiteContext,
  resolveCallSiteContext,
} from './call-site-context';
export { extractFile } from './file/extract';
export { transformFile } from './file/transform';
export { toMessageId } from './message-id';
export { parseMessageKey, toMessageKey } from './message-key';
export {
  type ParsedMessage,
  type Placeholder,
  type PlaceholderKind,
  parsePlaceholders,
  type TemplateDiagnostic,
} from './placeholder';
export { resolveProcessor, vanillaProcessor } from './processor';
