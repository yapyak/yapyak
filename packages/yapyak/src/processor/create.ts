import type { ApplyImportFn, ParseFragmentsFn, Processor } from './type';

/** Input for {@link createProcessor}. */
export type CreateProcessorInput = {
  /** The import-injection function. */
  applyImport?: ApplyImportFn;
  /** The file extensions handled by this processor. */
  extensions: string[];
  /**
   * The stable identifier.
   *
   * @remarks
   * Convention: lowercase suffix matching the package name.
   */
  id: string;
  /** The fragment-extraction function. */
  parseFragments?: ParseFragmentsFn;
  /** The runtime wiring. */
  runtime?: Processor['runtime'];
  /** Whether to skip the HMR-dispose callback. */
  skipHmrCallback?: boolean;
};

/**
 * Builds a processor from per-framework hooks.
 *
 * @param input - The input.
 *
 * @example
 * ```ts
 * import { createProcessor } from 'yapyak/processor';
 *
 * export const myProcessor = createProcessor({
 *   id: 'my-framework',
 *   extensions: ['.mfx'],
 *   runtime: { module: '@my-framework/binding/internal' }
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
