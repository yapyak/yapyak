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
 * The elision context.
 */
export type ElisionContext = {
  attributeName?: string;
  mode: 'attribute' | 'text';
  range: Range;
};

/**
 * The fragment segment. Maps one run of fragment code back to the source file it was taken from.
 */
export type FragmentSegment = {
  codeLength: number;
  sourceOffset: number;
};

/**
 * The fragment.
 */
export type Fragment = {
  code: string;
  elisionContext?: ElisionContext;
  enclosingElement?: string;
  snippet?: string;
  type: 'script' | 'template-expression';
  language: 'js' | 'ts';
  segments: FragmentSegment[];
};

/**
 * Injects a `yapyak` import into framework-specific source.
 *
 * @param magicString - The `MagicString` instance.
 * @param source - The source text.
 * @param importStatement - The import statement.
 */
export type ApplyImportFn = (
  magicString: MagicString,
  source: string,
  importStatement: string,
) => void;

/**
 * The source parse result.
 */
export type ParseSourceResult = {
  fragments: Fragment[];
};

/**
 * Breaks framework-specific source into TS-parseable fragments.
 *
 * @param source - The source text.
 */
export type ParseSourceFn = (source: string) => ParseSourceResult;

/**
 * The component hook.
 */
export type ComponentHook = {
  /** The eligibility directive. */
  eligibilityDirective?: string;
  /** The function name imported and invoked at the start of each matching component body. */
  invoke: string;
  /** The regex matching eligible component-function names. */
  namePattern: RegExp;
};

/**
 * The framework runtime wiring.
 */
export type Runtime = {
  /** The component hook. */
  componentHook?: ComponentHook;
  /** The framework runtime module. */
  module: string;
  /** The function name imported and invoked once at the top of each transformed source file. */
  register?: string;
};

/**
 * The processor.
 *
 * @see {@link createProcessor}
 */
export type Processor = {
  /** The import-injection function. */
  applyImport?(
    magicString: MagicString,
    source: string,
    importStatement: string,
  ): void;
  /** The file extensions handled by this processor. */
  extensions: string[];
  /** The stable identifier. */
  id: string;
  /** The source-parsing function. */
  parseSource?(source: string): ParseSourceResult;
  /** The runtime wiring. */
  runtime?: Runtime;
  /** Whether to skip the HMR-dispose callback. */
  skipHmrCallback?: boolean;
};
