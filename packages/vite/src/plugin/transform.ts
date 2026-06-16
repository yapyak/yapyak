import type { Plugin } from 'vite';
import type {
  ExtractFileResult,
  LocaleData,
  TransformFileResult,
} from 'yapyak/compiler/internal';
import type { State } from './state';

import {
  extractFile,
  findTranslation,
  transformFile,
} from 'yapyak/compiler/internal';

import { isCandidateId } from './candidate-id';
import { renderErrorDiagnostics } from './error-diagnostic';
import { toFileId } from './file-id';
import { getNormalized, getResolver } from './state';
import { readFile } from 'node:fs/promises';

export function createTransformPlugin(state: State): Plugin {
  return {
    enforce: 'pre',
    async load(id: string): Promise<{
      code: string;
      map: TransformFileResult['map'] | null;
    } | null> {
      if (id.startsWith('\0') || id.includes('?')) {
        return null;
      }
      if (!isCandidateId(id, state.filter, state.projectRoot)) {
        return null;
      }
      const raw = await readFile(id, 'utf8');
      const fileId = toFileId(state.projectRoot, id);
      const { locales } = getResolver(state).getEmittedLocales();
      const processors = getNormalized(state).processors;
      const extracted = extractFile(fileId, raw, {
        processors,
      });
      const errorDiagnostics = renderErrorDiagnostics(state.logger, extracted);
      if (errorDiagnostics.length > 0) {
        const first = errorDiagnostics[0];
        if (first) {
          this.error(`[yapyak] ${first.code}: ${first.message}`);
        }
      }
      if (extracted.callSites.length === 0) {
        return null;
      }
      const translations = buildTranslations({
        extracted,
        fileId,
        localeData: getResolver(state).getLocaleData(),
        locales,
      });
      const result = transformFile({
        defaultLocale: getResolver(state).getEmittedLocales().defaultLocale,
        dev: state.command === 'serve',
        extracted,
        fileId,
        locales,
        processors,
        source: raw,
        sourcePath: id,
        translations,
      });
      if (result.code === raw) {
        return null;
      }
      return {
        code: result.code,
        map: result.map,
      };
    },
    name: 'yapyak:transform',
  };
}

type BuildTranslationsInput = {
  extracted: ExtractFileResult;
  fileId: string;
  localeData: LocaleData;
  locales: string[];
};

function buildTranslations(
  input: BuildTranslationsInput,
): Record<string, Record<string, string>> {
  const translations: Record<string, Record<string, string>> = {};
  for (const message of input.extracted.messages) {
    for (const locale of input.locales) {
      const value = findTranslation(
        input.localeData[locale]?.[input.fileId]?.[message.source],
        message.context,
      );
      if (value === undefined || value === '') {
        continue;
      }
      let localeMap = translations[locale];
      if (!localeMap) {
        localeMap = {};
        translations[locale] = localeMap;
      }
      localeMap[message.id] = value;
    }
  }
  return translations;
}
