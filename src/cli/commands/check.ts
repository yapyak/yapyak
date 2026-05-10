import { existsSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { extractMessages } from '../../compiler/index.js';
import { findBareBindings } from '../../vite/find-bare-bindings.js';
import { loadConfig } from '../config.js';
import { findFiles } from '../find-files.js';

export interface CheckIssue {
  fileId: string;
  kind: 'missing' | 'stale' | 'invalid-json';
  locale?: string;
  source?: string;
}

export interface CheckResult {
  issues: CheckIssue[];
  totalSources: number;
}

export function runCheck(projectRoot: string): CheckResult {
  const config = loadConfig(projectRoot);
  const factoryNames = new Set(config.factories);
  const intlModules = new Set(config.intlModules);
  const issues: CheckIssue[] = [];

  const sourceFiles = findFiles({
    ignore: ['node_modules/**', 'dist/**', `${config.localesDir}/**`],
    patterns: config.source,
    root: projectRoot,
  });

  const extracted: Record<string, Set<string>> = {};

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
    for (const message of messages) {
      set.add(message.source);
    }
    extracted[fileId] = set;
  }

  let totalSources = 0;
  for (const sources of Object.values(extracted)) {
    totalSources += sources.size;
  }

  for (const locale of config.locales) {
    const localePath = join(projectRoot, config.localesDir, `${locale}.json`);
    let localeJson: Record<string, Record<string, string>>;
    try {
      localeJson = readJson(localePath);
    } catch {
      issues.push({ fileId: localePath, kind: 'invalid-json', locale });
      continue;
    }

    for (const [fileId, sources] of Object.entries(extracted)) {
      const fileTranslations = localeJson[fileId] ?? {};
      for (const source of sources) {
        const value = fileTranslations[source];
        if (value === undefined || value.trim() === '') {
          issues.push({ fileId, kind: 'missing', locale, source });
        }
      }
    }

    for (const [fileId, fileTranslations] of Object.entries(localeJson)) {
      const sources = extracted[fileId];
      for (const source of Object.keys(fileTranslations)) {
        if (!sources || !sources.has(source)) {
          issues.push({ fileId, kind: 'stale', locale, source });
        }
      }
    }
  }

  return { issues, totalSources };
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
