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
export { discoverCalls } from './discover-calls';
export { extractFile } from './extract-file';
export { toMessageId } from './message-id';
export { parseArguments } from './parse-arguments';
export { parsePlaceholders } from './plural';
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
} from './resolve-bindings';
export { transformFile } from './transform-file';
