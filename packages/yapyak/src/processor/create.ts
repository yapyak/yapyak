import type { CreateProcessorOptions, Processor } from './type';

/**
 * Builds a processor from per-framework hooks.
 *
 * @remarks
 * Returns a processor that yapyak's compiler dispatches to based on file extension. The shipped processor packages (`@yapyak/vue/processor`, `@yapyak/svelte/processor`, `@yapyak/astro/processor`) wrap this factory. Register processors in `yapyak.config.ts` via the `processors` field.
 *
 * @param options - The processor options.
 *
 * @example
 * ```ts
 * import { createProcessor } from 'yapyak/processor';
 *
 * export const myProcessor = createProcessor({
 *   id: 'my-framework',
 *   extensions: ['.mfx'],
 *   applyImport(magicString, source, importStatement) {
 *     magicString.prepend(`${importStatement}\n`);
 *   },
 *   parseFragments(source) {
 *     return [{ code: source, kind: 'script', lang: 'ts', originalOffset: 0 }];
 *   },
 * });
 * ```
 *
 * @throws {Error} When `id` is empty.
 * @throws {Error} When `extensions` is empty.
 */
export function createProcessor(options: CreateProcessorOptions): Processor {
  if (options.id === '') {
    throw new Error('createProcessor: id must be a non-empty string.');
  }
  if (options.extensions.length === 0) {
    throw new Error('createProcessor: extensions must be a non-empty array.');
  }
  return {
    applyImport: options.applyImport,
    extensions: options.extensions,
    id: options.id,
    parseFragments: options.parseFragments,
  };
}
