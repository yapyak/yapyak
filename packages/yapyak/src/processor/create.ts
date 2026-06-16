import type { ApplyImportFn, ParseFragmentsFn, Processor } from './type';

/** Input for {@link createProcessor}. */
export type CreateProcessorInput = {
  /** Injects a `yapyak` import into framework-specific source. Omit to use the default `prepend`-the-statement behavior — fits plain TS/JS files. */
  applyImport?: ApplyImportFn;
  /** File extensions this processor handles, e.g. `['.vue']`. */
  extensions: string[];
  /** Stable identifier for diagnostics. Convention: lowercase suffix matching the package name. */
  id: string;
  /** Breaks framework-specific source into TS-parseable fragments. Omit to use the default whole-source-as-one-script behavior — fits plain TS/JS files. */
  parseFragments?: ParseFragmentsFn;
  /** Compiler-emitted runtime wiring. See {@link Processor.runtime}. */
  runtime?: Processor['runtime'];
  /** Skips the dev-mode `import.meta.hot.dispose(...)` callback yapyak normally injects to invalidate cached catalogs on file change. Set when the host framework's compiler cannot safely embed Vite HMR callbacks at the top level (e.g. Astro). */
  skipHmrCallback?: boolean;
};

/**
 * Builds a processor from per-framework hooks.
 *
 * @remarks
 * Yapyak's compiler dispatches to the resulting processor based on file extension. The shipped processor packages (`@yapyak/react/processor`, `@yapyak/vue/processor`, `@yapyak/svelte/processor`, `@yapyak/astro/processor`) wrap this factory. Processors are registered in `yapyak.config.ts` via the `processors` field.
 *
 * @param input - Processor construction input. See {@link CreateProcessorInput}.
 *
 * @example
 * ```ts
 * import { createProcessor } from 'yapyak/processor';
 *
 * export const myProcessor = createProcessor({
 *   id: 'my-framework',
 *   extensions: ['.mfx'],
 *   runtime: { module: '@my-framework/binding/internal' },
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
  const processor: Processor = {
    extensions: input.extensions,
    id: input.id,
  };
  if (input.applyImport !== undefined) {
    processor.applyImport = input.applyImport;
  }
  if (input.parseFragments !== undefined) {
    processor.parseFragments = input.parseFragments;
  }
  if (input.runtime !== undefined) {
    processor.runtime = input.runtime;
  }
  if (input.skipHmrCallback !== undefined) {
    processor.skipHmrCallback = input.skipHmrCallback;
  }
  return processor;
}
