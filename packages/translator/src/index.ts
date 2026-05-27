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
  MessageContext,
  TranslateBatchOptions,
  TranslateBatchRequest,
  TranslateItem,
  TranslateRequest,
  Translator,
} from './type';

export { createTranslator } from './translator';
