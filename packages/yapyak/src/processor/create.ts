import type { CreateProcessorInput, Processor } from './type';

/**
 * Builds a processor from per-framework hooks.
 *
 * @remarks
 * Yapyak's compiler dispatches to the resulting processor based on file extension. The shipped processor packages (`@yapyak/vue/processor`, `@yapyak/svelte/processor`, `@yapyak/astro/processor`) wrap this factory. Processors are registered in `yapyak.config.ts` via the `processors` field.
 *
 * @param input - The processor's hooks and identity. See {@link CreateProcessorInput}.
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
export function createProcessor(input: CreateProcessorInput): Processor {
  if (input.id === '') {
    throw new Error('createProcessor: id must be a non-empty string.');
  }
  if (input.extensions.length === 0) {
    throw new Error('createProcessor: extensions must be a non-empty array.');
  }
  return {
    applyImport: input.applyImport,
    extensions: input.extensions,
    id: input.id,
    parseFragments: input.parseFragments,
  };
}
