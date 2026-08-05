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
  if (entry && entry.source === source && entry.callSiteCount === 0) {
    return {
      callSites: [],
      diagnostics: entry.diagnostics,
      messages: entry.messages,
    };
  }
  const result = extractFile(fileId, source, {
    processors: getNormalized(state).processors,
  });
  state.extractionCache.set(fileId, {
    callSiteCount: result.callSites.length,
    diagnostics: result.diagnostics,
    messages: result.messages,
    source,
  });
  return result;
}
