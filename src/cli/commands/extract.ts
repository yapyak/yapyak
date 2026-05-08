import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { extractMessages } from '../../compiler/index.js';
import {
  detectRenames,
  type MessagePosition,
  type Rename,
} from '../../vite/detect-renames.js';
import { findBareBindings } from '../../vite/find-bare-bindings.js';
import {
  loadPositionCache,
  type PositionCache,
  savePositionCache,
} from '../../vite/position-cache.js';
import { loadConfig } from '../config.js';
import { findFiles } from '../find-files.js';

export interface ExtractResult {
  added: number;
  files: number;
  removed: number;
  renamed: number;
  total: number;
}

export function runExtract(projectRoot: string): ExtractResult {
  const config = loadConfig(projectRoot);
  const factoryNames = new Set(config.factories);
  const intlModules = new Set(config.intlModules);

  const sourceFiles = findFiles({
    ignore: ['node_modules/**', 'dist/**', `${config.localesDir}/**`],
    patterns: config.source,
    root: projectRoot,
  });

  const extracted: Record<string, Set<string>> = {};
  const newPositions: PositionCache = {};
  const renamesByFile: Record<string, Rename[]> = {};
  const oldPositions = loadPositionCache(projectRoot);
  let renamedCount = 0;

  for (const file of sourceFiles) {
    const code = readFileSync(file, 'utf8');
    const fileId = relative(projectRoot, file).split(sep).join('/');
    const bareNames = findBareBindings({ code, intlModules });
    const messages = extractMessages({
      bareNames,
      code,
      factoryNames,
      fileId,
    });
    if (messages.length === 0) {
      continue;
    }
    const set = extracted[fileId] ?? new Set<string>();
    const positions: MessagePosition[] = [];
    for (const message of messages) {
      set.add(message.source);
      positions.push({
        column: message.column,
        line: message.line,
        source: message.source,
      });
    }
    extracted[fileId] = set;
    newPositions[fileId] = positions;

    const fileRenames = detectRenames(oldPositions[fileId] ?? [], positions);
    if (fileRenames.length > 0) {
      renamesByFile[fileId] = fileRenames;
      renamedCount += fileRenames.length;
    }
  }

  if (Object.keys(renamesByFile).length > 0) {
    applyRenames({
      defaultLocale: config.defaultLocale,
      locales: config.locales,
      localesDir: config.localesDir,
      projectRoot,
      renamesByFile,
    });
  }

  savePositionCache(projectRoot, newPositions);

  const sourcePath = join(
    projectRoot,
    config.localesDir,
    `${config.defaultLocale}.json`,
  );
  const previous = readJson(sourcePath);

  const next: Record<string, Record<string, string>> = {};
  let added = 0;
  let removed = 0;
  let total = 0;

  for (const [fileId, sources] of Object.entries(extracted)) {
    const fileTranslations: Record<string, string> = {};
    for (const source of sources) {
      const previousValue = previous[fileId]?.[source];
      if (previousValue === undefined) {
        added++;
      }
      fileTranslations[source] = previousValue ?? source;
      total++;
    }
    next[fileId] = fileTranslations;
  }

  for (const [fileId, fileTranslations] of Object.entries(previous)) {
    const currentSources = extracted[fileId];
    if (!currentSources) {
      removed += Object.keys(fileTranslations).length;
      continue;
    }
    for (const source of Object.keys(fileTranslations)) {
      if (!currentSources.has(source)) {
        removed++;
      }
    }
  }

  writeJson(sourcePath, next);
  syncOtherLocales(
    projectRoot,
    config.localesDir,
    config.locales,
    config.defaultLocale,
    next,
  );

  return {
    added,
    files: Object.keys(next).length,
    removed,
    renamed: renamedCount,
    total,
  };
}

interface ApplyRenamesArgs {
  defaultLocale: string;
  locales: string[];
  localesDir: string;
  projectRoot: string;
  renamesByFile: Record<string, Rename[]>;
}

function applyRenames(args: ApplyRenamesArgs): void {
  const { defaultLocale, locales, localesDir, projectRoot, renamesByFile } =
    args;
  for (const locale of locales) {
    const path = join(projectRoot, localesDir, `${locale}.json`);
    const json = readJson(path);
    let changed = false;
    for (const [fileId, renames] of Object.entries(renamesByFile)) {
      const fileEntries = json[fileId];
      if (!fileEntries) {
        continue;
      }
      for (const rename of renames) {
        const previous = fileEntries[rename.from];
        if (previous === undefined) {
          continue;
        }
        if (locale === defaultLocale) {
          fileEntries[rename.to] = rename.to;
        } else {
          fileEntries[rename.to] = previous;
        }
        delete fileEntries[rename.from];
        changed = true;
      }
    }
    if (changed) {
      writeJson(path, json);
    }
  }
}

function syncOtherLocales(
  projectRoot: string,
  localesDir: string,
  locales: string[],
  defaultLocale: string,
  source: Record<string, Record<string, string>>,
): void {
  for (const locale of locales) {
    if (locale === defaultLocale) {
      continue;
    }
    const path = join(projectRoot, localesDir, `${locale}.json`);
    const existing = readJson(path);
    const next: Record<string, Record<string, string>> = {};
    for (const [fileId, sources] of Object.entries(source)) {
      const fileTranslations: Record<string, string> = {};
      for (const sourceString of Object.keys(sources)) {
        const previousValue = existing[fileId]?.[sourceString];
        if (previousValue !== undefined) {
          fileTranslations[sourceString] = previousValue;
        }
      }
      if (Object.keys(fileTranslations).length > 0) {
        next[fileId] = fileTranslations;
      }
    }
    writeJson(path, next);
  }
}

function readJson(path: string): Record<string, Record<string, string>> {
  if (!existsSync(path)) {
    return {};
  }
  const raw = readFileSync(path, 'utf8');
  if (raw.trim() === '') {
    return {};
  }
  return JSON.parse(raw);
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
