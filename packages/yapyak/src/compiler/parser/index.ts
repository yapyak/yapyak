export type { Diagnostic } from './diagnostic';
export type {
  ExtractFileResult,
  ExtractedMessage,
  Location,
} from './file/extract';
export type { TransformFileResult } from './file/transform';
export type { Placeholder } from './placeholder';

export { extractFile } from './file/extract';
export { transformFile } from './file/transform';
export { fromMessageKey, toMessageKey } from './message-key';
export { parsePlaceholders } from './placeholder';
export { vanillaProcessor } from './processor';
