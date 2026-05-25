/**
 * Programmatic entry point for the `yapyak` CLI. Most users invoke the `yapyak` binary instead.
 *
 * ## Installation
 *
 * ```bash
 * npm install @yapyak/cli
 * # or
 * pnpm add @yapyak/cli
 * ```
 *
 * @packageDocumentation
 */

export { loadYapyakConfig, type YapyakCliConfig } from './load-config';
export { run } from './run';
