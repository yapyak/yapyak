import type { Processor } from '../../processor';

import { vanillaProcessor } from '../../processor/internal';

export function resolveProcessor(
  fileId: string,
  source: string,
  customProcessors: Processor[],
): Processor {
  for (const processor of customProcessors) {
    for (const extension of processor.extensions) {
      if (fileId.endsWith(extension)) {
        if (isAlreadyCompiled(source)) {
          return vanillaProcessor;
        }
        return processor;
      }
    }
  }
  return vanillaProcessor;
}

function isAlreadyCompiled(source: string): boolean {
  return source.includes("from 'yapyak/internal'");
}
