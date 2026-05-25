/**
 * Compile-time extraction and locale-file synchronization for yapyak.
 *
 * The public entry exposes catalog operations — discover locale files, read
 * their contents, migrate keys, sync entries, and serialize them canonically.
 * Build-tool authors and editor tooling should import the extraction and
 * transform primitives from `@yapyak/compiler/internal` instead.
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
