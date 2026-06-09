import type { ApplyImportFn, ParseFragmentsFn, Processor } from './type';

/**
 * Builds a processor from per-framework hooks.
 *
 * @remarks
 * Yapyak's compiler dispatches to the resulting processor based on file extension. The shipped processor packages (`@yapyak/vue/processor`, `@yapyak/svelte/processor`, `@yapyak/astro/processor`) wrap this factory. Processors are registered in `yapyak.config.ts` via the `processors` field.
 *
 * @param applyImport - Injects a `yapyak` import into framework-specific source.
 * @param extensions - File extensions this processor handles, e.g. `['.vue']`.
 * @param id - Stable identifier for diagnostics. Convention: lowercase suffix matching the package name.
 * @param parseFragments - Breaks framework-specific source into TS-parseable fragments.
 *
 * @example
 * ```ts
 * import { createProcessor } from 'yapyak/processor';
 *
 * export const myProcessor = createProcessor(
 *   (magicString, source, importStatement) => {
 *     magicString.prepend(`${importStatement}\n`);
 *   },
 *   ['.mfx'],
 *   'my-framework',
 *   (source) => [{ code: source, kind: 'script', lang: 'ts', originalOffset: 0 }],
 * );
 * ```
 *
 * @throws {Error} When `id` is empty.
 * @throws {Error} When `extensions` is empty.
 */
export function createProcessor(
  applyImport: ApplyImportFn,
  extensions: string[],
  id: string,
  parseFragments: ParseFragmentsFn,
): Processor {
  if (id === '') {
    throw new Error('createProcessor: id must be a non-empty string.');
  }
  if (extensions.length === 0) {
    throw new Error('createProcessor: extensions must be a non-empty array.');
  }
  return {
    applyImport,
    extensions,
    id,
    parseFragments,
  };
}
