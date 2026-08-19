export type { FindEntryAtInput, LocaleEntry, LocaleFix } from './locale';
export type { CompilerModule } from './project';

export { resolveCliPath, runCli, toCliErrorDetail } from './cli';
export { toDiagnosticCode, toDiagnosticItem } from './diagnostic-item';
export { collectDocumentDiagnostics } from './document-diagnostic';
export { resolveEntryOffset } from './entry-offset';
export { buildHoverMarkdown, buildLocaleHoverMarkdown } from './hover-markdown';
export {
  buildLocaleCompletions,
  collectFileKeys,
  collectLocaleEntries,
  findEntryAt,
  findFileKeyAt,
  isLocaleFile,
  resolveDeletionRange,
  resolveLocaleFix,
  toLocaleCode,
  toLocaleCodeError,
} from './locale';
export { findMessageAt } from './message';
export {
  findProjectRoot,
  invalidateProjectMessages,
  readProjectLocales,
  readProjectProgress,
  resolveProject,
  resolveProjectMessages,
} from './project';
export { SOURCE_LANGUAGES, buildSourceCompletions } from './source';
export { buildStatusText } from './status-text';
export { buildTranslationStats, buildTranslationTable } from './translation';
export { collectUntranslatedEntries } from './untranslated-entry';
