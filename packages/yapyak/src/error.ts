/**
 * The JSON-safe shape produced by {@link YapyakError.toJSON}.
 *
 * @remarks
 * Lets you log, serialize, or transport yapyak errors across boundaries (network, worker, structured logs) without losing the `code` or `meta` fields.
 */
export interface SerializedYapyakError {
  cause: unknown;
  code: string;
  message: string;
  meta: Record<string, unknown> | undefined;
  name: string;
  stack: string | undefined;
}

interface YapyakErrorOptions {
  cause?: unknown;
  code: string;
  meta?: Record<string, unknown>;
}

/**
 * Errors thrown by yapyak. Catch these to handle yapyak-specific failures
 * distinct from other errors in your app.
 *
 * Each error carries a stable `code` you can branch on, plus optional
 * structured `meta` and `cause` for diagnostics. Codes are prefixed by source:
 * - `YPK_*` — yapyak core
 * - `YAK_<3-letter>_*` — sub-packages (e.g. `YAK_ANT_*` for `@yapyak/anthropic`)
 *
 * @example
 * ```ts
 * try {
 *   // some yapyak operation
 * } catch (err) {
 *   if (err instanceof YapyakError) {
 *     console.error(`yapyak [${err.code}] ${err.message}`, err.meta);
 *     return;
 *   }
 *   throw err;
 * }
 * ```
 */
export class YapyakError extends Error {
  override name = 'YapyakError';
  code: string;
  meta?: Record<string, unknown>;

  constructor(message: string, options: YapyakErrorOptions) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.code = options.code;
    this.meta = options.meta;
    Error.captureStackTrace?.(this, new.target);
  }

  toJSON(): SerializedYapyakError {
    return {
      cause: this.cause,
      code: this.code,
      message: this.message,
      meta: this.meta,
      name: this.name,
      stack: this.stack,
    };
  }
}
