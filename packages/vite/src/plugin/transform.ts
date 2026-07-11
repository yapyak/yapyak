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
  getDocsUrl,
  transformFile,
} from 'yapyak/compiler/internal';

import { isCandidateId } from './candidate-id';
import { formatDiagnostic, renderErrorDiagnostics } from './error-diagnostic';
import { toFileId } from './file-id';
import { isLocaleFile } from './locale-file';
import { getNormalized, getResolver } from './state';
import { join } from 'node:path';

export function createTransformPlugin(state: State): Plugin {
  return {
    enforce: 'pre',
    name: 'yapyak:transform',
    transform(
      code: string,
      id: string,
    ): {
      code: string;
      map: TransformFileResult['map'] | null;
    } | null {
      if (id.startsWith('\0')) {
        return null;
      }
      if (VITE_NON_CODE_QUERY_RX.test(id)) {
        return null;
      }
      const queryStart = id.indexOf('?');
      const filePath = queryStart === -1 ? id : id.slice(0, queryStart);
      if (!isCandidateId(filePath, state.filter, state.projectRoot)) {
        return null;
      }
      const fileId = toFileId(state.projectRoot, filePath);
      const { locales } = getResolver(state).getEmittedLocales();
      const processors = getNormalized(state).processors;
      const extracted = extractFile(fileId, code, {
        processors,
      });
      const errorDiagnostics = renderErrorDiagnostics(state.logger, extracted);
      const firstError = errorDiagnostics[0];
      if (firstError !== undefined) {
        for (let index = 1; index < errorDiagnostics.length; index += 1) {
          const subsequent = errorDiagnostics[index];
          if (subsequent !== undefined) {
            state.logger.error(formatDiagnostic(subsequent));
          }
        }
        this.error({
          code: firstError.code,
          id: firstError.fileId,
          loc: {
            column: firstError.range.start.column,
            file: firstError.fileId,
            line: firstError.range.start.line,
          },
          message: `${firstError.message}\nSee ${getDocsUrl(firstError.code)}`,
        });
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
        source: code,
        sourcePath: filePath,
        translations,
      });
      if (result.code === code) {
        return null;
      }
      if (state.command === 'build') {
        const localesDir = join(
          state.projectRoot,
          getNormalized(state).localesDir,
        );
        for (const locale of getResolver(state).getProjectLocales().locales) {
          this.addWatchFile(join(localesDir, `${locale}.json`));
        }
      }
      return {
        code: result.code,
        map: result.map,
      };
    },
    watchChange(
      id: string,
      change: {
        event: 'create' | 'delete' | 'update';
      },
    ): void {
      if (state.command !== 'build') {
        return;
      }
      if (!isLocaleFile(state, id)) {
        return;
      }
      if (change.event === 'update') {
        getResolver(state).invalidateData();
        return;
      }
      getResolver(state).invalidateStructure();
    },
  };
}

const VITE_NON_CODE_QUERY_RX =
  /\?(?:raw|url|inline|worker|sharedworker|init)\b/;

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
