import type { Plugin } from 'vite';
import type { State } from './state';

import { walkSourceFiles } from 'yapyak/compiler/internal';

import { renderErrorDiagnostics } from './error-diagnostic';
import { resolveExtraction } from './extraction';
import { fillStubs } from './stub';
import { syncAll } from './sync';

export function createScanPlugin(state: State): Plugin {
  return {
    buildStart(): void {
      if (state.command === 'build') {
        return;
      }
      scanAllSources(state);
      fillStubs(state);
    },
    name: 'yapyak:scan',
  };
}

function scanAllSources(state: State): void {
  const files = walkSourceFiles(state.filter, state.projectRoot);
  state.messagesByFile.clear();
  for (const file of files) {
    const result = resolveExtraction(state, file.fileId, file.code);
    renderErrorDiagnostics(state.logger, result);
    if (result.messages.length > 0) {
      state.messagesByFile.set(file.fileId, result.messages);
    }
  }
  syncAll(state);
}
