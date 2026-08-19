import type { Diagnostic } from 'yapyak/compiler/internal';
import type { Project } from './project';

import { isLocaleFile, toLocaleCode } from './locale';
import { resolveProjectMessages } from './project';
import { SOURCE_LANGUAGES } from './source';

export type CollectDocumentDiagnosticsInput = {
  content: string;
  fileId: string;
  languageId: string;
  path: string;
};

export function collectDocumentDiagnostics(
  project: Project,
  input: CollectDocumentDiagnosticsInput,
): Diagnostic[] {
  const { compiler, config, root } = project;
  const { content, fileId, languageId, path } = input;
  if (isLocaleFile(root, config.localesDir, path)) {
    const diagnostics = compiler.validateLocaleFile(fileId, path);
    const locale = toLocaleCode(path);
    if (locale === config.defaultLocale) {
      return diagnostics;
    }
    const { messages, sourceFileIds } = resolveProjectMessages(project);
    return [
      ...diagnostics,
      ...compiler.validateIcuPairs({
        content,
        fileId,
        locale,
        messages,
      }),
      ...compiler.validateEntryUsage({
        content,
        fileId,
        messages,
        sourceFileIds,
      }),
    ];
  }
  if (SOURCE_LANGUAGES.includes(languageId)) {
    return compiler.extractFile(fileId, content, {
      processors: config.processors,
    }).diagnostics;
  }
  return [];
}
