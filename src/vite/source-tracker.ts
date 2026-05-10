import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { extractMessages } from '../compiler/index.js';
import { detectRenames, type MessagePosition } from './detect-renames.js';
import { findBareBindings } from './find-bare-bindings.js';
import { loadPositionCache, savePositionCache } from './position-cache.js';

export interface SourceTrackerOptions {
  defaultLocale: string;
  factories: string[];
  intlModules: string[];
  locales: string[];
  localesDir: string;
  projectRoot: string;
}

export interface SourceTracker {
  onSourceFileChange: (absolutePath: string) => boolean;
}

export function createSourceTracker(
  options: SourceTrackerOptions,
): SourceTracker {
  const factoryNames = new Set(options.factories);
  const intlModules = new Set(options.intlModules);

  function onSourceFileChange(absolutePath: string): boolean {
    if (!/\.(?:tsx?|jsx?|mjs|cjs|vue|svelte)$/.test(absolutePath)) {
      return false;
    }
    if (!absolutePath.startsWith(options.projectRoot)) {
      return false;
    }
    if (!existsSync(absolutePath)) {
      return false;
    }

    const fileId = relative(options.projectRoot, absolutePath)
      .split(sep)
      .join('/');

    const code = readFileSync(absolutePath, 'utf8');
    const bareNames = findBareBindings({ code, intlModules });
    const extracted = extractMessages({
      bareNames,
      code,
      factoryNames,
      fileId,
    });

    const newPositions: MessagePosition[] = extracted.map((message) => ({
      column: message.column,
      line: message.line,
      source: message.source,
    }));

    const sources = new Set<string>();
    for (const message of extracted) {
      sources.add(message.source);
    }

    if (sources.size === 0) {
      return false;
    }

    const positionCache = loadPositionCache(options.projectRoot);
    const oldPositions = positionCache[fileId] ?? [];
    const renames = detectRenames(oldPositions, newPositions);

    if (renames.length > 0) {
      applyRenames({
        defaultLocale: options.defaultLocale,
        fileId,
        locales: options.locales,
        localesDir: options.localesDir,
        projectRoot: options.projectRoot,
        renames,
      });
      for (const rename of renames) {
        process.stdout.write(
          `[yapyak] ↻ "${rename.from}" → "${rename.to}" (rename detected, reusing translations)\n`,
        );
      }
    }

    positionCache[fileId] = newPositions;
    savePositionCache(options.projectRoot, positionCache);

    let changed = false;
    for (const locale of options.locales) {
      const path = localePath(options, locale);
      const json = readJson(path);
      const file = json[fileId] ?? {};
      let touched = false;
      for (const source of sources) {
        if (!(source in file)) {
          file[source] = locale === options.defaultLocale ? source : '';
          touched = true;
        }
      }
      if (touched) {
        json[fileId] = file;
        writeJson(path, sortFiles(json));
        changed = true;
      }
    }

    return changed;
  }

  return { onSourceFileChange };
}

function localePath(options: SourceTrackerOptions, locale: string): string {
  return join(options.projectRoot, options.localesDir, `${locale}.json`);
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
  const dir = dirname(path);
  if (!existsSync(dir)) {
    return;
  }
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function sortFiles(
  json: Record<string, Record<string, string>>,
): Record<string, Record<string, string>> {
  const sorted: Record<string, Record<string, string>> = {};
  for (const fileId of Object.keys(json).sort()) {
    const entries = json[fileId] ?? {};
    const sortedEntries: Record<string, string> = {};
    for (const source of Object.keys(entries).sort()) {
      const value = entries[source];
      if (value !== undefined) {
        sortedEntries[source] = value;
      }
    }
    sorted[fileId] = sortedEntries;
  }
  return sorted;
}

interface ApplyRenamesArgs {
  defaultLocale: string;
  fileId: string;
  locales: string[];
  localesDir: string;
  projectRoot: string;
  renames: Array<{ from: string; to: string }>;
}

function applyRenames(args: ApplyRenamesArgs): void {
  const { defaultLocale, fileId, locales, localesDir, projectRoot, renames } =
    args;
  for (const locale of locales) {
    const path = join(projectRoot, localesDir, `${locale}.json`);
    const json = readJson(path);
    const fileEntries = json[fileId];
    if (!fileEntries) {
      continue;
    }
    let changed = false;
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
    if (changed) {
      json[fileId] = fileEntries;
      writeJson(path, sortFiles(json));
    }
  }
}
