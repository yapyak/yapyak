/**
 * Compile-time extraction and locale-file synchronization for yapyak. Consumed by `@yapyak/vite`, `@yapyak/cli`, and future build-tool integrations.
 *
 * @packageDocumentation
 */

export {
  autoTranslate,
  type DiscoverLocalesOptions,
  type DiscoverLocalesResult,
  detectRenames,
  discoverLocales,
  type LocaleData,
  type LocaleFile,
  type MessagePosition,
  type MigrateLocalesOptions,
  type MigrateLocalesResult,
  migrateLocales,
  type ReadLocaleDataOptions,
  type RenameEntry,
  readLocaleData,
  readLocaleFile,
  type SyncLocaleFilesOptions,
  stringifyCanonical,
  syncLocaleFiles,
} from './catalog';
export {
  type ArgsRange,
  type CallSite,
  DEFAULT_EXCLUDE,
  DEFAULT_INCLUDE,
  DynamicMessageError,
  DynamicSourceError,
  deriveComponentName,
  type ExtractedMessage,
  type ExtractMessagesOptions,
  type ExtractSnippetOptions,
  extractMessages,
  extractSnippet,
  findCallSites,
  locate,
  parseSourceArg,
  sliceArguments,
  splitTopLevelArgs,
  type WalkedFile,
  type WalkSourceFilesOptions,
  walkSourceFiles,
} from './parser';
