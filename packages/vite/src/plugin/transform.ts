import type { Plugin } from 'vite';
import type {
  ExtractFileResult,
  LocaleData,
  TransformFileResult,
} from 'yapyak/compiler';
import type { State } from './state';

import { extractFile, toMessageKey, transformFile } from 'yapyak/compiler';

import { isCandidateId } from './candidate-id';
import { toFileId } from './file-id';

export function createTransformPlugin(state: State): Plugin {
  return {
    enforce: 'pre',
    name: 'yapyak:transform',
    transform(
      code: string,
      id: string,
    ): { code: string; map: TransformFileResult['map'] } | null {
      if (!isCandidateId(id, state.filter, state.projectRoot)) {
        return null;
      }
      const fileId = toFileId(state.projectRoot, id);
      const { locales } = state.getResolver().getEmittedLocales();
      const processors = state.getNormalized().processors;
      const extracted = extractFile(fileId, code, { processors });
      for (const diagnostic of extracted.diagnostics) {
        if (diagnostic.severity !== 'error') {
          continue;
        }
        state.error(
          `[yapyak] ${diagnostic.code} ${diagnostic.fileId}:${diagnostic.range.start.line}:${diagnostic.range.start.column}: ${diagnostic.message}`,
        );
      }
      if (extracted.callSites.length === 0) {
        return null;
      }
      const translations = buildTranslations({
        extracted,
        fileId,
        localeData: state.getResolver().getLocaleData(),
        locales,
      });
      const result = transformFile({
        defaultLocale: state.getResolver().getEmittedLocales().defaultLocale,
        extracted,
        fileId,
        locales,
        processors,
        source: code,
        sourcePath: id,
        translations,
      });
      if (result.code === code) {
        return null;
      }
      return { code: result.code, map: result.map };
    },
  };
}

interface BuildTranslationsInput {
  extracted: ExtractFileResult;
  fileId: string;
  localeData: LocaleData;
  locales: string[];
}

function buildTranslations(
  input: BuildTranslationsInput,
): Record<string, Record<string, string>> {
  const translations: Record<string, Record<string, string>> = {};
  for (const message of input.extracted.messages) {
    const messageKey = toMessageKey(message.source, message.context);
    for (const locale of input.locales) {
      const localeFile = input.localeData[locale];
      const fileEntries = localeFile?.[input.fileId];
      const value = fileEntries?.[messageKey];
      if (typeof value !== 'string' || value === '') {
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
