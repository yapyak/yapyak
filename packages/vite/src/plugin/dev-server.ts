import type { HmrContext, Plugin, ViteDevServer } from 'vite';
import type {
  ExtractedMessage,
  LocaleFile,
  LocaleWarning,
} from 'yapyak/compiler';
import type { State } from './state';

import {
  detectRenames,
  extractFile,
  migrateLocales,
  syncLocaleFiles,
  validateLocaleCode,
  writeRegister,
} from 'yapyak/compiler';

import { RUNTIME_RESOLVED } from '../virtual-runtime';
import { isCandidateId } from './candidate-id';
import { renderErrorDiagnostics } from './error-diagnostic';
import { toFileId } from './file-id';
import { renderLocaleWarning } from './locale-warning';
import { getNormalized, getResolver } from './state';
import { fillStubs } from './stub';
import { syncAll } from './sync';
import { runYapyakCommand } from './yapyak-command';
import { readFileSync } from 'node:fs';
import { basename, extname, join, relative, sep } from 'node:path';

type CallSitePosition = {
  column: number;
  line: number;
  source: string;
};

type Debounced = {
  cancel(): void;
  (): void;
};

export function createDevServerPlugin(state: State): Plugin {
  return {
    buildEnd(): void {
      for (const cancel of state.teardownCallbacks) {
        cancel();
      }
      state.teardownCallbacks.length = 0;
    },
    configureServer(server: ViteDevServer): void {
      if (state.configFile !== undefined) {
        server.watcher.add(state.configFile);
      }

      const pendingActionByFileId = new Map<string, 'add' | 'unlink'>();
      const flush = debounce(() => {
        if (pendingActionByFileId.size === 0) {
          return;
        }
        for (const [fileId, kind] of pendingActionByFileId) {
          if (kind === 'unlink') {
            state.messagesByFile.delete(fileId);
            continue;
          }
          let code: string;
          try {
            code = readFileSync(join(state.projectRoot, fileId), 'utf8');
          } catch {
            state.messagesByFile.delete(fileId);
            continue;
          }
          const result = extractFile(fileId, code, {
            processors: getNormalized(state).processors,
          });
          renderErrorDiagnostics(state.logger, result);
          if (result.messages.length > 0) {
            state.messagesByFile.set(fileId, result.messages);
          } else {
            state.messagesByFile.delete(fileId);
          }
        }
        pendingActionByFileId.clear();
        syncAll(state);
        fillStubs(state);
      }, 50);
      state.teardownCallbacks.push(flush.cancel);

      const reloadCandidateModules = (): void => {
        for (const mod of server.moduleGraph.idToModuleMap.values()) {
          if (
            mod.file !== null &&
            isCandidateId(mod.file, state.filter, state.projectRoot)
          ) {
            void server.reloadModule(mod);
          }
        }
      };

      const reloadRuntimeModule = (): void => {
        const runtimeMod = server.moduleGraph.getModuleById(RUNTIME_RESOLVED);
        if (runtimeMod) {
          void server.reloadModule(runtimeMod);
        }
      };

      const previousLocaleData = new Map<string, LocaleFile>();
      const pendingLocalePaths = new Set<string>();
      const invalidateLocaleData = debounce(() => {
        if (pendingLocalePaths.size === 0) {
          return;
        }
        const changedFileIds = new Set<string>();
        for (const localePath of pendingLocalePaths) {
          const locale = localeFromPath(localePath);
          const before = previousLocaleData.get(locale) ?? {};
          const after = readLocaleFile(localePath);
          previousLocaleData.set(locale, after);
          for (const fileId of extractChangedFileIds(before, after)) {
            changedFileIds.add(fileId);
          }
        }
        pendingLocalePaths.clear();
        if (changedFileIds.size === 0) {
          return;
        }
        getResolver(state).invalidateData();
        for (const fileId of changedFileIds) {
          const absolutePath = join(state.projectRoot, fileId);
          const modules = server.moduleGraph.getModulesByFile(absolutePath);
          if (!modules) {
            continue;
          }
          for (const mod of modules) {
            if (mod.file?.endsWith('.astro')) {
              server.moduleGraph.invalidateModule(mod);
              server.ws.send({
                path: mod.file,
                type: 'full-reload',
              });
              continue;
            }
            void server.reloadModule(mod);
          }
        }
      }, 50);
      state.teardownCallbacks.push(invalidateLocaleData.cancel);

      const syncLocaleStructure = debounce(() => {
        getResolver(state).invalidateStructure();
        const { defaultLocale, locales } =
          getResolver(state).getProjectLocales();
        const allMessages: ExtractedMessage[] = [];
        for (const list of state.messagesByFile.values()) {
          allMessages.push(...list);
        }
        const result = syncLocaleFiles(
          {
            filter: state.filter,
            messages: allMessages,
          },
          {
            defaultLocale,
            locales,
            localesDir: getNormalized(state).localesDir,
          },
          state.projectRoot,
          {
            yapyakDir: state.yapyakDir,
          },
        );
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
        writeRegister(
          getResolver(state).getEmittedLocales().locales,
          state.yapyakDir,
        );
        reloadRuntimeModule();
        reloadCandidateModules();
      }, 50);
      state.teardownCallbacks.push(syncLocaleStructure.cancel);

      server.watcher.on('change', (path: string) => {
        if (state.configFile !== undefined && path === state.configFile) {
          void server.restart();
          return;
        }
        if (isLocaleFile(state, path)) {
          pendingLocalePaths.add(path);
          invalidateLocaleData();
        }
      });

      server.watcher.on('add', (path: string) => {
        if (isCandidateId(path, state.filter, state.projectRoot)) {
          pendingActionByFileId.set(toFileId(state.projectRoot, path), 'add');
          flush();
          return;
        }
        if (isLocaleFile(state, path)) {
          const locale = localeFromPath(path);
          const validation = validateLocaleCode(locale);
          if (!validation.valid && validation.issue) {
            const warning: LocaleWarning = {
              code: locale,
              issue: validation.issue,
            };
            if (validation.suggestion !== undefined) {
              warning.suggestion = validation.suggestion;
            }
            state.logger.warn(
              renderLocaleWarning(warning, getNormalized(state).localesDir),
            );
            return;
          }
          const hint = `Run \`${runYapyakCommand(`translate ${locale}`)}\` to fill the stubs.`;
          syncLocaleStructure();
          state.logger.info(
            `[yapyak] New locale '${locale}' detected. ${hint}`,
          );
          server.ws.send({
            data: {
              hint,
              locale,
            },
            event: 'yapyak:locale-added',
            type: 'custom',
          });
        }
      });

      server.watcher.on('unlink', (path: string) => {
        if (isCandidateId(path, state.filter, state.projectRoot)) {
          pendingActionByFileId.set(
            toFileId(state.projectRoot, path),
            'unlink',
          );
          flush();
          return;
        }
        if (isLocaleFile(state, path)) {
          const locale = localeFromPath(path);
          syncLocaleStructure();
          state.logger.info(`[yapyak] Locale '${locale}' removed.`);
          server.ws.send({
            data: {
              locale,
            },
            event: 'yapyak:locale-removed',
            type: 'custom',
          });
        }
      });
    },
    async handleHotUpdate(context: HmrContext): Promise<void> {
      if (!isCandidateId(context.file, state.filter, state.projectRoot)) {
        return;
      }
      const fileId = toFileId(state.projectRoot, context.file);
      const code = await context.read();
      const { defaultLocale, locales } = getResolver(state).getEmittedLocales();
      const result = extractFile(fileId, code, {
        processors: getNormalized(state).processors,
      });
      renderErrorDiagnostics(state.logger, result);
      const before = state.messagesByFile.get(fileId) ?? [];
      const after = result.messages;
      if (areMessagesEqual(before, after)) {
        return;
      }
      const renames = detectRenames(
        before.flatMap(toCallSitePositions),
        after.flatMap(toCallSitePositions),
      );
      if (renames.length > 0) {
        migrateLocales(
          {
            extractedSources: toExtractedSourcesForFile(fileId, after),
            fileId,
            renames,
          },
          {
            defaultLocale,
            locales,
            localesDir: getNormalized(state).localesDir,
          },
          state.projectRoot,
          {
            preserveTranslations:
              getNormalized(state).preserveTranslationsOnRename,
          },
        );
        getResolver(state).invalidateData();
        const { server } = context;
        if (server) {
          const runtimeMod = server.moduleGraph.getModuleById(RUNTIME_RESOLVED);
          if (runtimeMod) {
            void server.reloadModule(runtimeMod);
          }
        }
      }
      if (after.length === 0) {
        state.messagesByFile.delete(fileId);
      } else {
        state.messagesByFile.set(fileId, after);
      }
      syncAll(state);
      fillStubs(state);
    },
    name: 'yapyak:dev-server',
  };
}

function isLocaleFile(state: State, path: string): boolean {
  const directory = join(state.projectRoot, getNormalized(state).localesDir);
  const relativePath = relative(directory, path);
  if (
    relativePath === '' ||
    relativePath.startsWith('..') ||
    relativePath.includes(sep)
  ) {
    return false;
  }
  return extname(relativePath) === '.json';
}

function localeFromPath(path: string): string {
  const base = basename(path);
  return base.slice(0, -extname(base).length);
}

export function readLocaleFile(path: string): LocaleFile {
  let raw: string;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {};
  }
  return parsed as LocaleFile;
}

export function extractChangedFileIds(
  before: LocaleFile,
  after: LocaleFile,
): Set<string> {
  const changed = new Set<string>();
  for (const [fileId, beforeEntries] of Object.entries(before)) {
    if (!areEntriesEqual(beforeEntries, after[fileId])) {
      changed.add(fileId);
    }
  }
  for (const fileId of Object.keys(after)) {
    if (!(fileId in before)) {
      changed.add(fileId);
    }
  }
  return changed;
}

export function areEntriesEqual(
  a: Record<string, string>,
  b: Record<string, string> | undefined,
): boolean {
  if (!b) {
    return false;
  }
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) {
    return false;
  }
  for (const key of aKeys) {
    if (a[key] !== b[key]) {
      return false;
    }
  }
  return true;
}

function toCallSitePositions(message: ExtractedMessage): CallSitePosition[] {
  return message.locations.map((location) => ({
    column: location.range.start.column,
    line: location.range.start.line,
    source: message.source,
  }));
}

function toExtractedSourcesForFile(
  fileId: string,
  messages: ExtractedMessage[],
): Record<string, Set<string>> {
  const sources = new Set<string>();
  for (const message of messages) {
    sources.add(message.source);
  }
  return {
    [fileId]: sources,
  };
}

function areMessagesEqual(
  a: ExtractedMessage[],
  b: ExtractedMessage[],
): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let index = 0; index < a.length; index++) {
    const left = a[index];
    const right = b[index];
    if (!left || !right) {
      return false;
    }
    if (
      left.id !== right.id ||
      left.locations.length !== right.locations.length
    ) {
      return false;
    }
    for (
      let locationIndex = 0;
      locationIndex < left.locations.length;
      locationIndex++
    ) {
      const leftLocation = left.locations[locationIndex];
      const rightLocation = right.locations[locationIndex];
      if (!leftLocation || !rightLocation) {
        return false;
      }
      if (
        leftLocation.range.start.line !== rightLocation.range.start.line ||
        leftLocation.range.start.column !== rightLocation.range.start.column
      ) {
        return false;
      }
    }
  }
  return true;
}

function debounce(fn: () => void, ms: number): Debounced {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const debounced = (() => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(fn, ms);
  }) as Debounced;
  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
  };
  return debounced;
}
