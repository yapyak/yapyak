import type {
  ExtractedMessage,
  SyncLocaleFilesResult,
} from 'yapyak/compiler/internal';
import type { State } from './state';

import { hasParseFailure, syncLocaleFiles } from 'yapyak/compiler/internal';

import { getNormalized, getResolver } from './state';

export function syncAll(state: State): void {
  const allMessages: ExtractedMessage[] = [];
  for (const list of state.messagesByFile.values()) {
    allMessages.push(...list);
  }
  const { locales, sourceLocale } = getResolver(state).getProjectLocales();
  const result = syncLocaleFiles(
    {
      filter: (fileId) => state.filter(fileId) && isParsed(state, fileId),
      messages: allMessages,
    },
    {
      locales,
      localesDir: getNormalized(state).localesDir,
      sourceLocale,
    },
    state.projectRoot,
    {
      yapyakDir: state.yapyakDir,
    },
  );
  emitSyncDiagnostics(state, result);
  getResolver(state).invalidateData();
}

function isParsed(state: State, fileId: string): boolean {
  const entry = state.extractionCache.get(fileId);
  return entry === undefined || !hasParseFailure(entry);
}

function emitSyncDiagnostics(
  state: State,
  result: SyncLocaleFilesResult,
): void {
  for (const entry of result.orphaned) {
    state.logger.warn(
      `[yapyak] preserved '${entry.source}' (${entry.locale}) — call site removed from ${entry.fileId}, translation saved in case it returns.`,
    );
  }
  for (const entry of result.restored) {
    state.logger.info(
      `[yapyak] restored '${entry.source}' (${entry.locale}) in ${entry.fileId} — translation kept from when the call site was removed earlier.`,
    );
  }
}
