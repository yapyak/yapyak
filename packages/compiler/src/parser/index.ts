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

export { resolveCallSiteContext } from './call-site-context';
export {
  type CreateDiagnosticInput,
  createDiagnostic,
} from './diagnostic';
export { discoverCalls } from './call';
export { extractFile } from './file/extract';
export { toMessageId } from './message-id';
export { parseArguments } from './argument';
export { parsePlaceholders } from './placeholder';
export {
  astroProcessor,
  getProcessor,
  resolveProcessorKind,
  svelteProcessor,
  vanillaProcessor,
  vueProcessor,
} from './processor';
export {
  type ResolveBindingsOptions,
  resolveBindings,
} from './binding';
export { transformFile } from './file/transform';
