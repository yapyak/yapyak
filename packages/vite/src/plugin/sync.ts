import type { ExtractedMessage, SyncLocaleFilesResult } from 'yapyak/compiler';
import type { State } from './state';

import { syncLocaleFiles } from 'yapyak/compiler';

import { getNormalized, getResolver } from './state';

export function syncAll(state: State): void {
  const allMessages: ExtractedMessage[] = [];
  for (const list of state.messagesByFile.values()) {
    allMessages.push(...list);
  }
  const { defaultLocale, locales } = getResolver(state).getProjectLocales();
  const result = syncLocaleFiles(
    { filter: state.filter, messages: allMessages },
    {
      defaultLocale,
      locales,
      localesDir: getNormalized(state).localesDir,
    },
    state.projectRoot,
    { yapyakDir: state.yapyakDir },
  );
  emitSyncDiagnostics(state, result);
  getResolver(state).invalidateData();
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
