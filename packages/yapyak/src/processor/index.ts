export type { CreateProcessorInput } from './create';
export type {
  ApplyImportFn,
  ComponentHook,
  ElisionContext,
  Fragment,
  FragmentSegment,
  ParseSourceFn,
  ParseSourceResult,
  Position,
  Processor,
  ProcessorDiagnostic,
  Range,
  Runtime,
} from './type';

export { createProcessor } from './create';
export {
  offsetToOriginalPosition,
  rangeFromOffsets,
  segmentsFromOffset,
} from './offset';
