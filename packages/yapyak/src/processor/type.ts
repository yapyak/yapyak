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
 * The fragment.
 */
export type Fragment = {
  code: string;
  elisionContext?: ElisionContext;
  type: 'script' | 'template-expression';
  language: 'js' | 'ts';
  originalOffset: number;
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
 * Breaks framework-specific source into TS-parseable fragments.
 *
 * @param source - The source text.
 */
export type ParseFragmentsFn = (source: string) => Fragment[];

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
  /** The fragment-extraction function. */
  parseFragments?(source: string): Fragment[];
  /** The runtime wiring. */
  runtime?: Runtime;
  /** Whether to skip the HMR-dispose callback. */
  skipHmrCallback?: boolean;
};
