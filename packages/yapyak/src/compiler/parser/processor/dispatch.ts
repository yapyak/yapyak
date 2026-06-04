import type { Processor } from '../../../processor';

import { vanillaProcessor } from './vanilla';

export function dispatchProcessor(
  fileId: string,
  source: string,
  customProcessors: readonly Processor[],
): Processor {
  for (const processor of customProcessors) {
    for (const extension of processor.extensions) {
      if (fileId.endsWith(extension)) {
        if (looksAlreadyCompiled(source)) {
          return vanillaProcessor;
        }
        return processor;
      }
    }
  }
  return vanillaProcessor;
}

function looksAlreadyCompiled(source: string): boolean {
  return source.trimStart().startsWith('import');
}
