import { existsSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { extractMessages } from '../../compiler/index.js';
import { findBareBindings } from '../../vite/find-bare-bindings.js';
import { loadConfig } from '../config.js';
import { findFiles } from '../find-files.js';

export interface MissingMessage {
  componentName: string;
  fileId: string;
  line: number;
  missingLocales: string[];
  source: string;
}

export interface PerLocaleStats {
  missing: number;
  translated: number;
}

export interface StatusReport {
  defaultLocale: string;
  locales: string[];
  missing: MissingMessage[];
  perLocale: Record<string, PerLocaleStats>;
  totalMessages: number;
}

export function runStatus(projectRoot: string): StatusReport {
  const config = loadConfig(projectRoot);
  const factoryNames = new Set(config.factories);
  const intlModules = new Set(config.intlModules);

  const sourceFiles = findFiles({
    ignore: ['node_modules/**', 'dist/**', `${config.localesDir}/**`],
    patterns: config.source,
    root: projectRoot,
  });

  type ExtractedRecord = {
    componentName: string;
    fileId: string;
    line: number;
    source: string;
  };
  const extracted: ExtractedRecord[] = [];

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
    for (const message of messages) {
      extracted.push({
        componentName: message.context.componentName,
        fileId: message.fileId,
        line: message.line,
        source: message.source,
      });
    }
  }

  const totalMessages = extracted.length;
  const perLocale: Record<string, PerLocaleStats> = {};

  for (const locale of config.locales) {
    perLocale[locale] = { missing: 0, translated: 0 };
  }

  const localeJson: Record<string, Record<string, Record<string, string>>> = {};
  for (const locale of config.locales) {
    localeJson[locale] = readJson(
      join(projectRoot, config.localesDir, `${locale}.json`),
    );
  }

  const missing: MissingMessage[] = [];

  for (const record of extracted) {
    const missingLocales: string[] = [];
    for (const locale of config.locales) {
      const value = localeJson[locale]?.[record.fileId]?.[record.source];
      if (value === undefined || value === '') {
        missingLocales.push(locale);
        const stats = perLocale[locale];
        if (stats) {
          stats.missing++;
        }
      } else {
        const stats = perLocale[locale];
        if (stats) {
          stats.translated++;
        }
      }
    }
    if (missingLocales.length > 0) {
      missing.push({
        componentName: record.componentName,
        fileId: record.fileId,
        line: record.line,
        missingLocales,
        source: record.source,
      });
    }
  }

  return {
    defaultLocale: config.defaultLocale,
    locales: config.locales,
    missing,
    perLocale,
    totalMessages,
  };
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
