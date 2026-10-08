export type { Diagnostic } from './diagnostic';
export type {
  ExtractFileResult,
  ExtractedMessage,
  Location,
} from './file/extract';
export type { TransformFileResult } from './file/transform';

export { extractFile, hasParseFailure } from './file/extract';
export { transformFile } from './file/transform';
export { resolveProcessor } from './processor';
