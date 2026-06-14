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
  /** Injects a `yapyak` import into framework-specific source. Defaults to prepending the statement when omitted — fits plain TS/JS files. */
  applyImport?(
    magicString: MagicString,
    source: string,
    importStatement: string,
  ): void;
  /** File extensions this processor handles. */
  extensions: string[];
  /** Stable identifier for diagnostics. */
  id: string;
  /** Breaks framework-specific source into TS-parseable fragments. Defaults to the whole source as one script when omitted — fits plain TS/JS files. */
  parseFragments?(source: string): Fragment[];
  /**
   * Compiler-emitted runtime wiring. The dev transform imports `module` so the framework's HMR side effects fire. When `invoke` is set, the dev transform imports the named function from the same module and injects a call at the top of every React function component containing `t()` instead of a bare side-effect import.
   */
  runtime?: {
    invoke?: string;
    module: string;
  };
};
