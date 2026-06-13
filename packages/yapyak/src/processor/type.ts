import type MagicString from 'magic-string';

/**
 * The position. Locates a point in source by line, column, and byte offset (1-based).
 */
export type Position = {
  column: number;
  line: number;
  offset: number;
};

/**
 * The range. Spans from a start to an end position in source.
 */
export type Range = {
  end: Position;
  start: Position;
};

/**
 * Elision context for source-text portions that should be skipped when reading the surrounding code.
 */
export type ElisionContext = {
  attributeName?: string;
  mode: 'attribute' | 'text';
  range: Range;
};

/**
 * The fragment. Holds TS-parseable code extracted from a framework-specific source file.
 */
export type Fragment = {
  code: string;
  elision?: ElisionContext;
  kind: 'script' | 'template-expression';
  lang: 'js' | 'ts';
  originalOffset: number;
};

/**
 * Injects a `yapyak` import into framework-specific source.
 *
 * @param magicString - The {@link MagicString} instance to mutate.
 * @param source - The original source text.
 * @param importStatement - The import statement to inject.
 */
export type ApplyImportFn = (
  magicString: MagicString,
  source: string,
  importStatement: string,
) => void;

/**
 * Breaks framework-specific source into TS-parseable fragments.
 *
 * @param source - The source text.
 */
export type ParseFragmentsFn = (source: string) => Fragment[];

/**
 * The processor. Extracts framework-specific source into fragments yapyak's compiler can read.
 *
 * @remarks
 * Returned by {@link createProcessor} and by the framework processor packages (`@yapyak/vue/processor`, `@yapyak/svelte/processor`, `@yapyak/astro/processor`). Registered in `yapyak.config.ts` via the `processors` field.
 *
 * Public extension point. Implemented by the framework processor packages and by third-party processors.
 */
export type Processor = {
  /** Injects a `yapyak` import into framework-specific source. */
  applyImport(
    magicString: MagicString,
    source: string,
    importStatement: string,
  ): void;
  /** File extensions this processor handles. */
  extensions: string[];
  /** Stable identifier for diagnostics. */
  id: string;
  /** Breaks framework-specific source into TS-parseable fragments. */
  parseFragments(source: string): Fragment[];
  /** Package name the dev transform side-effect-imports for HMR wiring. */
  runtimeBinding?: string;
};
