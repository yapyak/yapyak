/**
 * Compiler for yapyak.
 *
 * ## Installation
 *
 * ```bash
 * npm install @yapyak/compiler
 * # or
 * pnpm add @yapyak/compiler
 * ```
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
