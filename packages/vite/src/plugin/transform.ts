import type { Plugin } from 'vite';
import type {
  ExtractFileResult,
  LocaleData,
  TransformFileResult,
} from 'yapyak/compiler';
import type { State } from './state';

import { extractFile, findTranslation, transformFile } from 'yapyak/compiler';

import { isCandidateId } from './candidate-id';
import { renderErrorDiagnostics } from './error-diagnostic';
import { toFileId } from './file-id';
import { getNormalized, getResolver } from './state';

export function createTransformPlugin(state: State): Plugin {
  return {
    enforce: 'pre',
    name: 'yapyak:transform',
    transform(
      code: string,
      id: string,
    ): {
      code: string;
      map: TransformFileResult['map'];
    } | null {
      if (!isCandidateId(id, state.filter, state.projectRoot)) {
        return null;
      }
      const fileId = toFileId(state.projectRoot, id);
      const { locales } = getResolver(state).getEmittedLocales();
      const processors = getNormalized(state).processors;
      const extracted = extractFile(fileId, code, {
        processors,
      });
      renderErrorDiagnostics(state.logger, extracted);
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
        source: code,
        sourcePath: id,
        translations,
      });
      if (result.code === code) {
        return null;
      }
      return {
        code: result.code,
        map: result.map,
      };
    },
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
