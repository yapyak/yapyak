import type { HotUpdateOptions, Plugin, ViteDevServer } from 'vite';
import type {
  CatalogEntry,
  ExtractedMessage,
  LocaleFile,
  LocaleWarning,
  Template,
} from 'yapyak/compiler';
import type { State } from './state';

import {
  detectRenames,
  extractFile,
  migrateLocales,
  parseTemplate,
  syncLocaleFiles,
  toMessageKey,
  validateLocaleCode,
  writeRegister,
} from 'yapyak/compiler';

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

type Patch = {
  fileId: string;
  id: string;
  locale: string;
  value: string | Template;
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

      const previousLocaleData = new Map<string, LocaleFile>();
      const pendingLocalePaths = new Set<string>();
      const sendLocalePatches = debounce(() => {
        if (pendingLocalePaths.size === 0) {
          return;
        }
        const allPatches: Patch[] = [];
        const astroFilesToReload = new Set<string>();
        for (const localePath of pendingLocalePaths) {
          const locale = localeFromPath(localePath);
          const before = previousLocaleData.get(locale) ?? {};
          const after = readLocaleFile(localePath);
          previousLocaleData.set(locale, after);
          const localePatches = derivePatches(before, after, locale);
          for (const patch of localePatches) {
            if (patch.fileId.endsWith('.astro')) {
              const absolutePath = join(state.projectRoot, patch.fileId);
              astroFilesToReload.add(absolutePath);
            } else {
              allPatches.push(patch);
            }
          }
        }
        pendingLocalePaths.clear();
        if (allPatches.length === 0 && astroFilesToReload.size === 0) {
          return;
        }
        getResolver(state).invalidateData();
        for (const file of astroFilesToReload) {
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
      }, 50);
      state.teardownCallbacks.push(sendLocalePatches.cancel);

      const announceLocaleStructure = debounce(() => {
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
      }, 50);
      state.teardownCallbacks.push(announceLocaleStructure.cancel);

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
          const hint = `Run \`${runYapyakCommand(`translate ${locale}`)}\` to fill the stubs.`;
          announceLocaleStructure();
          state.logger.info(
            `[yapyak] New locale '${locale}' detected. ${hint}`,
          );
          const initial = readLocaleFile(path);
          previousLocaleData.set(locale, initial);
          const initialPatches = derivePatches({}, initial, locale);
          if (initialPatches.length > 0) {
            server.ws.send({
              data: {
                patches: initialPatches,
              },
              event: 'yapyak:patch',
              type: 'custom',
            });
          }
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
          previousLocaleData.delete(locale);
          announceLocaleStructure();
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
    async hotUpdate(context: HotUpdateOptions): Promise<void> {
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
            preserveTranslations:
              getNormalized(state).preserveTranslationsOnRename,
          },
        );
        getResolver(state).invalidateData();
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

export function derivePatches(
  before: LocaleFile,
  after: LocaleFile,
  locale: string,
): Patch[] {
  const patches: Patch[] = [];
  const fileIds = new Set<string>([
    ...Object.keys(before),
    ...Object.keys(after),
  ]);
  for (const fileId of fileIds) {
    const beforeEntries = before[fileId] ?? {};
    const afterEntries = after[fileId] ?? {};
    const sources = new Set<string>([
      ...Object.keys(beforeEntries),
      ...Object.keys(afterEntries),
    ]);
    for (const source of sources) {
      const beforeEntry = beforeEntries[source];
      const afterEntry = afterEntries[source];
      walkEntry(patches, fileId, source, locale, beforeEntry, afterEntry);
    }
  }
  return patches;
}

function walkEntry(
  patches: Patch[],
  fileId: string,
  source: string,
  locale: string,
  beforeEntry: CatalogEntry | undefined,
  afterEntry: CatalogEntry | undefined,
): void {
  if (typeof afterEntry === 'string') {
    if (typeof beforeEntry !== 'string' || beforeEntry !== afterEntry) {
      patches.push({
        fileId,
        id: toMessageKey(source),
        locale,
        value: compileLocaleValue(afterEntry),
      });
    }
    return;
  }
  if (afterEntry && typeof afterEntry === 'object') {
    const beforeMap =
      beforeEntry && typeof beforeEntry === 'object' ? beforeEntry : {};
    const contexts = new Set<string>([
      ...Object.keys(beforeMap),
      ...Object.keys(afterEntry),
    ]);
    for (const context of contexts) {
      const beforeValue = beforeMap[context];
      const afterValue = afterEntry[context];
      if (typeof afterValue === 'string') {
        if (beforeValue !== afterValue) {
          patches.push({
            fileId,
            id: toMessageKey(source, context),
            locale,
            value: compileLocaleValue(afterValue),
          });
        }
      } else if (afterValue === undefined && typeof beforeValue === 'string') {
        patches.push({
          fileId,
          id: toMessageKey(source, context),
          locale,
          value: '',
        });
      }
    }
    return;
  }
  if (typeof beforeEntry === 'string') {
    patches.push({
      fileId,
      id: toMessageKey(source),
      locale,
      value: '',
    });
  }
  if (beforeEntry && typeof beforeEntry === 'object') {
    for (const context of Object.keys(beforeEntry)) {
      patches.push({
        fileId,
        id: toMessageKey(source, context),
        locale,
        value: '',
      });
    }
  }
}

function compileLocaleValue(raw: string): string | Template {
  const { template } = parseTemplate(raw);
  if (template.length === 0) {
    return '';
  }
  if (template.length === 1 && template[0]?.kind === 'literal') {
    return template[0].value;
  }
  return template;
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
  a: Record<string, CatalogEntry>,
  b: Record<string, CatalogEntry> | undefined,
): boolean {
  if (!b) {
    return false;
  }
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) {
    return false;
  }
  for (const key of aKeys) {
    if (!isEntryEqual(a[key], b[key])) {
      return false;
    }
  }
  return true;
}

function isEntryEqual(
  a: CatalogEntry | undefined,
  b: CatalogEntry | undefined,
): boolean {
  if (a === undefined || b === undefined) {
    return a === b;
  }
  if (typeof a === 'string' || typeof b === 'string') {
    return a === b;
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

function toExtractedKeysForFile(
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
