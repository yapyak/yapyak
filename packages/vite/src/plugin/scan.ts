import type { Plugin } from 'vite';
import type {
  ExtractedMessage,
  LocaleData,
  SyncLocaleFilesResult,
} from 'yapyak/compiler';
import type { Translator } from 'yapyak/translator';
import type { EngineState } from './state';

import {
  autoTranslate,
  extractFile,
  syncLocaleFiles,
  validateLocaleCode,
  walkSourceFiles,
} from 'yapyak/compiler';

import { logErrors } from './error';
import { runYapyakCommand } from './yapyak-command';

interface TranslationErrorEntry {
  error: unknown;
  fileId: string;
  locale: string;
  source: string;
}

interface TranslationErrorGroup {
  entries: TranslationErrorEntry[];
  error: unknown;
  locale: string;
}

export function syncAll(state: EngineState): void {
  const allMessages: ExtractedMessage[] = [];
  for (const list of state.messagesByFile.values()) {
    allMessages.push(...list);
  }
  const { defaultLocale, locales } = state.getResolver().getProjectLocales();
  const result = syncLocaleFiles(
    { filter: state.filter, messages: allMessages },
    {
      defaultLocale,
      locales,
      localesDir: state.getNormalized().localesDir,
    },
    state.projectRoot,
    { yapyakDir: state.yapyakDir },
  );
  emitSyncDiagnostics(state, result);
  state.getResolver().invalidateData();
}

export function scanAllSources(state: EngineState): void {
  const files = walkSourceFiles(state.filter, state.projectRoot);
  const processors = state.getNormalized().processors;
  state.messagesByFile.clear();
  for (const file of files) {
    const result = extractFile(file.fileId, file.code, { processors });
    logErrors(state, result);
    if (result.messages.length > 0) {
      state.messagesByFile.set(file.fileId, result.messages);
    }
  }
  syncAll(state);
}

export function fillStubs(state: EngineState): void {
  const config = state.getNormalized();
  const translator = config.translator;
  if (!translator) {
    return;
  }
  if (config.autoTranslateThreshold <= 0) {
    return;
  }
  const allMessages: ExtractedMessage[] = [];
  for (const list of state.messagesByFile.values()) {
    allMessages.push(...list);
  }
  if (allMessages.length === 0) {
    return;
  }
  const { defaultLocale, locales } = state.getResolver().getProjectLocales();
  const translatableLocales = locales.filter(
    (locale) => validateLocaleCode(locale).valid,
  );
  const missing = discoverMissingSources(
    allMessages,
    translatableLocales,
    defaultLocale,
    state.getResolver().getLocaleData(),
  );
  if (missing.size === 0) {
    return;
  }
  if (missing.size > config.autoTranslateThreshold) {
    state.info(
      `[yapyak] ${missing.size} new strings detected. Run \`${runYapyakCommand('translate')}\` to fill.`,
    );
    return;
  }
  const filtered = allMessages.filter((message) => missing.has(message.source));
  const targetLocaleCount = translatableLocales.filter(
    (locale) => locale !== defaultLocale,
  ).length;
  const startedAt = Date.now();
  state.info(
    `[yapyak] translating ${filtered.length} ${pluralize('string', filtered.length)} × ${targetLocaleCount} ${pluralize('locale', targetLocaleCount)} via ${translator.id}…`,
  );
  void runAutoTranslate(state, {
    defaultLocale,
    filtered,
    locales,
    startedAt,
    translator,
  });
}

export function createScanPlugin(state: EngineState): Plugin {
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

interface RunAutoTranslateInput {
  defaultLocale: string;
  filtered: ExtractedMessage[];
  locales: string[];
  startedAt: number;
  translator: Translator;
}

async function runAutoTranslate(
  state: EngineState,
  input: RunAutoTranslateInput,
): Promise<void> {
  const config = state.getNormalized();
  if (!input.translator) {
    return;
  }
  try {
    const result = await autoTranslate(
      { messages: input.filtered, translator: input.translator },
      {
        defaultLocale: input.defaultLocale,
        locales: input.locales,
        localesDir: config.localesDir,
      },
      state.projectRoot,
      { examples: config.examples, yapyakDir: state.yapyakDir },
    );
    if (result.translated > 0) {
      state.getResolver().invalidateData();
    }
    const elapsed = formatElapsed(Date.now() - input.startedAt);
    if (result.errors.length === 0) {
      state.info(`[yapyak] ✓ ${result.translated} translated · ${elapsed}`);
    } else {
      state.info(
        `[yapyak] ${result.translated} translated, ${result.errors.length} failed · ${elapsed}`,
      );
    }
    for (const group of buildErrorGroups(result.errors)) {
      state.warn(renderTranslationErrorGroup(group));
    }
  } catch (error: unknown) {
    const elapsed = formatElapsed(Date.now() - input.startedAt);
    state.warn(`[yapyak] auto-translate error · ${elapsed} · ${String(error)}`);
  }
}

function emitSyncDiagnostics(
  state: EngineState,
  result: SyncLocaleFilesResult,
): void {
  for (const entry of result.orphaned) {
    state.warn(
      `[yapyak] preserved '${entry.source}' (${entry.locale}) — call site removed from ${entry.fileId}, translation saved in case it returns.`,
    );
  }
  for (const entry of result.restored) {
    state.info(
      `[yapyak] restored '${entry.source}' (${entry.locale}) in ${entry.fileId} — translation kept from when the call site was removed earlier.`,
    );
  }
}

function discoverMissingSources(
  messages: ExtractedMessage[],
  locales: string[],
  defaultLocale: string,
  localeData: LocaleData,
): Set<string> {
  const missing = new Set<string>();
  for (const message of messages) {
    if (missing.has(message.source)) {
      continue;
    }
    let isFlagged = false;
    for (const locale of locales) {
      if (locale === defaultLocale) {
        continue;
      }
      const localeFile = localeData[locale];
      for (const location of message.locations) {
        const existing = localeFile?.[location.fileId]?.[message.source];
        if (typeof existing !== 'string' || existing === '') {
          missing.add(message.source);
          isFlagged = true;
          break;
        }
      }
      if (isFlagged) {
        break;
      }
    }
  }
  return missing;
}

function buildErrorGroups(
  errors: TranslationErrorEntry[],
): TranslationErrorGroup[] {
  const groups = new Map<string, TranslationErrorGroup>();
  for (const entry of errors) {
    const key = `${entry.locale}\0${String(entry.error)}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        entries: [],
        error: entry.error,
        locale: entry.locale,
      };
      groups.set(key, group);
    }
    group.entries.push(entry);
  }
  return [...groups.values()];
}

function renderTranslationErrorGroup(group: TranslationErrorGroup): string {
  const message = String(group.error);
  if (group.entries.length === 1) {
    const entry = group.entries[0];
    if (!entry) {
      return `[yapyak] translation failed: ${group.locale} — ${message}`;
    }
    return `[yapyak] translation failed: ${entry.locale} ${entry.fileId} "${entry.source}" — ${message}`;
  }
  const fileCount = new Set(group.entries.map((entry) => entry.fileId)).size;
  const stringPart = `${group.entries.length} ${pluralize('string', group.entries.length)}`;
  const filePart =
    fileCount === 1
      ? `in ${group.entries[0]?.fileId ?? '?'}`
      : `across ${fileCount} ${pluralize('file', fileCount)}`;
  return `[yapyak] batch failed: ${group.locale} (${stringPart} ${filePart}) — ${message}`;
}

function pluralize(word: string, count: number): string {
  return count === 1 ? word : `${word}s`;
}

function formatElapsed(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}
