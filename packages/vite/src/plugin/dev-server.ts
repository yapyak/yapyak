import type {
  EnvironmentModuleNode,
  HotUpdateOptions,
  Logger,
  Plugin,
  ViteDevServer,
} from 'vite';
import type {
  ExtractedMessage,
  LocaleFile,
  LocaleWarning,
} from 'yapyak/compiler/internal';
import type { NormalizedYapyakConfig } from 'yapyak/config/internal';
import type { Patch } from 'yapyak/internal';
import type { State } from './state';

import {
  CorruptLocaleFileError,
  YAP_RUNTIME,
  detectRenames,
  getDocsUrl,
  migrateLocales,
  readLocaleFile,
  toMessageKey,
  toVariants,
  validateLocaleCode,
  writeRegister,
} from 'yapyak/compiler/internal';
import { buildPatches } from 'yapyak/internal';

import { isCandidateId } from './candidate-id';
import { hasParseFailure, renderErrorDiagnostics } from './error-diagnostic';
import { resolveExtraction } from './extraction';
import { toFileId } from './file-id';
import { isLocaleFile } from './locale-file';
import { renderLocaleWarning } from './locale-warning';
import { getNormalized, getResolver } from './state';
import { fillStubs } from './stub';
import { syncAll } from './sync';
import { runYapyakCommand } from './yapyak-command';
import { readFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

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
      const flush = debounce(
        () => {
          if (pendingActionByFileId.size === 0) {
            return;
          }
          for (const [fileId, kind] of pendingActionByFileId) {
            if (kind === 'unlink') {
              state.extractionCache.delete(fileId);
              state.messagesByFile.delete(fileId);
              continue;
            }
            let code: string;
            try {
              code = readFileSync(join(state.projectRoot, fileId), 'utf8');
            } catch {
              state.extractionCache.delete(fileId);
              state.messagesByFile.delete(fileId);
              continue;
            }
            const result = resolveExtraction(state, fileId, code);
            renderErrorDiagnostics(state.logger, result);
            if (hasParseFailure(result)) {
              continue;
            }
            if (result.messages.length > 0) {
              state.messagesByFile.set(fileId, result.messages);
            } else {
              state.messagesByFile.delete(fileId);
            }
          }
          pendingActionByFileId.clear();
          syncAll(state);
          fillStubs(state);
        },
        50,
        state.logger,
      );
      state.teardownCallbacks.push(flush.cancel);

      const previousLocaleData = new Map<string, LocaleFile>();
      const { localesDir } = getNormalized(state);
      for (const locale of getResolver(state).getProjectLocales().locales) {
        const initial = tryReadLocaleFile(
          join(state.projectRoot, localesDir, `${locale}.json`),
          state.logger,
        );
        if (initial === undefined) {
          continue;
        }
        previousLocaleData.set(locale, initial);
      }
      const pendingLocalePaths = new Set<string>();
      const sendLocalePatches = debounce(
        () => {
          if (pendingLocalePaths.size === 0) {
            return;
          }
          const allPatches: Patch[] = [];
          const filesToReload = new Set<string>();
          const patchedFiles = new Set<string>();
          const skipHmrExtensions = getNormalized(state)
            .processors.filter(
              (processor) => processor.skipHmrCallback === true,
            )
            .flatMap((processor) => processor.extensions);
          for (const localePath of pendingLocalePaths) {
            const locale = localeFromPath(localePath);
            const before = previousLocaleData.get(locale) ?? {};
            const after = tryReadLocaleFile(localePath, state.logger);
            if (after === undefined) {
              continue;
            }
            previousLocaleData.set(locale, after);
            const localePatches = buildPatches(before, after, locale);
            for (const patch of localePatches) {
              patchedFiles.add(join(state.projectRoot, patch.fileId));
              if (
                skipHmrExtensions.some((extension) =>
                  patch.fileId.endsWith(extension),
                )
              ) {
                filesToReload.add(join(state.projectRoot, patch.fileId));
              } else {
                allPatches.push(patch);
              }
            }
          }
          pendingLocalePaths.clear();
          if (allPatches.length === 0 && filesToReload.size === 0) {
            return;
          }
          getResolver(state).invalidateData();
          invalidateEnvironments(server, patchedFiles);
          for (const file of filesToReload) {
            server.ws.send({
              path: file,
              type: 'full-reload',
            });
          }
          if (allPatches.length > 0) {
            server.ws.send({
              data: {
                patches: allPatches,
              },
              event: 'yapyak:patch',
              type: 'custom',
            });
          }
        },
        50,
        state.logger,
      );
      state.teardownCallbacks.push(sendLocalePatches.cancel);

      const syncLocaleStructure = debounce(
        () => {
          syncAll(state);
          writeRegister(
            getResolver(state).getEmittedLocales().locales,
            state.yapyakDir,
          );
        },
        50,
        state.logger,
      );
      state.teardownCallbacks.push(syncLocaleStructure.cancel);

      server.watcher.on('change', (path: string) => {
        if (state.configFile !== undefined && path === state.configFile) {
          void server.restart();
          return;
        }
        if (isLocaleFile(state, path)) {
          pendingLocalePaths.add(path);
          sendLocalePatches();
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
          getResolver(state).invalidateStructure();
          reloadAllModules(server);
          syncLocaleStructure();
          const initial = tryReadLocaleFile(path, state.logger);
          state.logger.info(
            renderNewLocaleMessage(locale, initial, getNormalized(state)),
          );
          if (initial === undefined) {
            return;
          }
          previousLocaleData.set(locale, initial);
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
          previousLocaleData.delete(locale);
          getResolver(state).invalidateStructure();
          reloadAllModules(server);
          syncLocaleStructure();
          state.logger.info(`[yapyak] Locale '${locale}' removed.`);
        }
      });
    },
    async hotUpdate(
      options: HotUpdateOptions,
    ): Promise<EnvironmentModuleNode[] | undefined> {
      if (!isCandidateId(options.file, state.filter, state.projectRoot)) {
        return undefined;
      }
      if (options.type === 'delete') {
        return [];
      }
      if (options.type === 'create') {
        return undefined;
      }
      const fileId = toFileId(state.projectRoot, options.file);
      const code = await options.read();
      const { defaultLocale, locales } = getResolver(state).getProjectLocales();
      const result = resolveExtraction(state, fileId, code);
      renderErrorDiagnostics(state.logger, result);
      if (hasParseFailure(result)) {
        return undefined;
      }
      const before = state.messagesByFile.get(fileId) ?? [];
      const after = result.messages;
      if (areMessagesEqual(before, after)) {
        return undefined;
      }
      const renames = detectRenames(
        before.flatMap(toCallSitePositions),
        after.flatMap(toCallSitePositions),
      );
      if (
        renames.length > 0 &&
        getNormalized(state).preserveTranslationsOnRename
      ) {
        const migrationResult = migrateLocales(
          {
            extractedKeys: toExtractedKeysForFile(fileId, after),
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
            preserveTranslations: true,
          },
        );
        for (const conflict of migrationResult.conflicts) {
          state.logger.warn(
            `[yapyak] rename '${conflict.from}' → '${conflict.to}' skipped for '${conflict.locale}' in ${conflict.fileId} — target already has a translation.`,
          );
        }
        getResolver(state).invalidateData();
      }
      if (after.length === 0) {
        state.messagesByFile.delete(fileId);
      } else {
        state.messagesByFile.set(fileId, after);
      }
      syncAll(state);
      fillStubs(state);
      return undefined;
    },
    name: 'yapyak:dev-server',
  };
}

function invalidateEnvironments(
  server: ViteDevServer,
  files: Set<string>,
): void {
  for (const environment of Object.values(server.environments)) {
    const affected = new Set<EnvironmentModuleNode>();
    for (const file of files) {
      for (const module of environment.moduleGraph.getModulesByFile(file) ??
        []) {
        collectWithImporters(module, affected);
      }
    }
    for (const module of affected) {
      environment.moduleGraph.invalidateModule(module);
    }
  }
}

function collectWithImporters(
  module: EnvironmentModuleNode,
  seen: Set<EnvironmentModuleNode>,
): void {
  if (seen.has(module)) {
    return;
  }
  seen.add(module);
  for (const importer of module.importers) {
    collectWithImporters(importer, seen);
  }
}

function reloadAllModules(server: ViteDevServer): void {
  server.moduleGraph.invalidateAll();
  server.ws.send({
    type: 'full-reload',
  });
}

function tryReadLocaleFile(
  path: string,
  logger: Logger,
): LocaleFile | undefined {
  try {
    return readLocaleFile(path);
  } catch (error) {
    if (error instanceof CorruptLocaleFileError) {
      logger.warn(
        `${error.message}\nSee ${getDocsUrl(YAP_RUNTIME.CATALOG_LOCALE_FILE_CORRUPT.code)}`,
      );
      return undefined;
    }
    const reason = error instanceof Error ? error.message : String(error);
    logger.warn(
      `${YAP_RUNTIME.CATALOG_LOCALE_FILE_UNREADABLE.message({
        path,
        reason,
      })}\nSee ${getDocsUrl(YAP_RUNTIME.CATALOG_LOCALE_FILE_UNREADABLE.code)}`,
    );
    return undefined;
  }
}

function localeFromPath(path: string): string {
  const base = basename(path);
  return base.slice(0, -extname(base).length);
}

function renderNewLocaleMessage(
  locale: string,
  localeFile: LocaleFile | undefined,
  config: NormalizedYapyakConfig,
): string {
  const detected = `[yapyak] New locale '${locale}' detected.`;
  if (localeFile !== undefined && isTranslated(localeFile)) {
    return detected;
  }
  if (config.translator) {
    return `${detected} \`${runYapyakCommand(`translate ${locale}`)}\` fills anything untranslated.`;
  }
  return `${detected} Fill in ${config.localesDir}/${locale}.json.`;
}

function isTranslated(localeFile: LocaleFile): boolean {
  let hasTranslations = false;
  for (const entries of Object.values(localeFile)) {
    for (const entry of Object.values(entries)) {
      for (const { value } of toVariants(entry)) {
        if (value === '') {
          return false;
        }
        hasTranslations = true;
      }
    }
  }
  return hasTranslations;
}

function toCallSitePositions(message: ExtractedMessage): CallSitePosition[] {
  return message.locations.map((location) => ({
    column: location.range.start.column,
    line: location.range.start.line,
    source: message.source,
  }));
}

export function toExtractedKeysForFile(
  fileId: string,
  messages: ExtractedMessage[],
): Record<string, Set<string>> {
  const keys = new Set<string>();
  for (const message of messages) {
    keys.add(toMessageKey(message.source, message.context));
  }
  return {
    [fileId]: keys,
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

function debounce(
  fn: () => void,
  milliseconds: number,
  logger: Logger,
): Debounced {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const debounced = (() => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      try {
        fn();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`[yapyak] ${message}`);
      }
    }, milliseconds);
  }) as Debounced;
  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
  };
  return debounced;
}
