export type {
  CreateProcessorInput,
  ElisionContext,
  Fragment,
  Position,
  Processor,
  Range,
} from './type';

export { createProcessor } from './create';
export { offsetToOriginalPosition, rangeFromOffsets } from './offset';
