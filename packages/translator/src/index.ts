/**
 * Translator base for yapyak.
 *
 * ## Installation
 *
 * ```bash
 * npm install @yapyak/translator
 * # or
 * pnpm add @yapyak/translator
 * ```
 *
 * @packageDocumentation
 */

export type {
  ContextLevel,
  CreateTranslatorOptions,
  LocaleTranslations,
  MessageContext,
  TranslateBatchOptions,
  TranslateBatchRequest,
  TranslateItem,
  TranslateRequest,
  TranslationExample,
  Translator,
} from './type';

export { createTranslator } from './translator';
