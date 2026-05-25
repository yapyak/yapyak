export type {
  BindingTable,
  CallSite,
  CallSiteContext,
  Diagnostic,
  DiagnosticCode,
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
  YapyakBinding,
} from './type';

export { resolveCallSiteContext } from './call-site-context';
export { createDiagnostic } from './diagnostic';
export { discoverCalls } from './discover-calls';
export { extractFile } from './extract';
export { toMessageId } from './id';
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
export { resolveBindings } from './resolve-bindings';
export { transformFile } from './transform';
