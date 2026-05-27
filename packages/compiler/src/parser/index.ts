export type {
  Binding,
  BindingTable,
  CallSite,
  CallSiteContext,
  Diagnostic,
  DiagnosticCode,
  ElisionContext,
  ExtractedMessage,
  ExtractFileRequest,
  ExtractFileResult,
  Fragment,
  Location,
  ParsedArguments,
  ParsedParams,
  Placeholder,
  Position,
  Processor,
  ProcessorKind,
  Range,
  Scope,
  TransformFileRequest,
  TransformFileResult,
} from './type';

export { parseArguments } from './argument';
export {
  type ResolveBindingsOptions,
  resolveBindings,
} from './binding';
export { discoverCalls } from './call';
export { resolveCallSiteContext } from './call-site-context';
export {
  type CreateDiagnosticInput,
  createDiagnostic,
} from './diagnostic';
export { extractFile } from './file/extract';
export { transformFile } from './file/transform';
export { toMessageId } from './message-id';
export { parsePlaceholders } from './placeholder';
export {
  astroProcessor,
  getProcessor,
  resolveProcessorKind,
  svelteProcessor,
  vanillaProcessor,
  vueProcessor,
} from './processor';
