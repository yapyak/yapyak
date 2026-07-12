import type { ExtractFileResult } from 'yapyak/compiler/internal';
import type { State } from './state';

import { extractFile } from 'yapyak/compiler/internal';

import { getNormalized } from './state';

export function resolveExtraction(
  state: State,
  fileId: string,
  source: string,
): ExtractFileResult {
  if (!source.includes('yapyak')) {
    return {
      callSites: [],
      diagnostics: [],
      messages: [],
    };
  }
  const entry = state.extractionCache.get(fileId);
  if (entry && entry.source === source) {
    return entry.result;
  }
  const result = extractFile(fileId, source, {
    processors: getNormalized(state).processors,
  });
  state.extractionCache.set(fileId, {
    result,
    source,
  });
  return result;
}
