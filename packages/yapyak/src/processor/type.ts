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
 * Per-component hook injection. Compiler walks each eligible script fragment,
 * finds functions whose name matches `namePattern` and contain at least one
 * `t()` call site, and injects `invoke()` at the start of the function body.
 *
 * Declare for frameworks where component functions re-run on state change
 * and need to subscribe to locale updates per component (React, Solid, Qwik).
 * Omit for frameworks whose reactivity is module-level (Vue, Svelte, Astro).
 */
export type ComponentHook = {
  /** String directive that must appear in the file's prologue for injection to apply. Omit to inject in every file. */
  eligibilityDirective?: string;
  /** Function name to import from `Runtime.module` and call at the start of every matching component body. */
  invoke: string;
  /** Regex matching component-like function names — PascalCase, `use*`-prefixed, framework-specific. */
  namePattern: RegExp;
};

/**
 * Framework runtime wiring. The transform emits a side-effect import of
 * `module` so the framework can register HMR or set up reactivity primitives.
 * When `componentHook` is set, the transform additionally imports and injects
 * the named function per matching component.
 */
export type Runtime = {
  /** Optional per-component hook injection. */
  componentHook?: ComponentHook;
  /** Framework runtime module imported once per file containing any `t()` call. */
  module: string;
};

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
  /** Framework runtime wiring. See {@link Runtime}. */
  runtime?: Runtime;
  /** Skips the dev-mode `import.meta.hot.dispose(...)` callback yapyak normally injects to invalidate cached catalogs on file change. Set when the host framework's compiler cannot safely embed Vite HMR callbacks at the top level (e.g. Astro). */
  skipHmrCallback?: boolean;
};
