/** Call-site context for a translation request. */
export interface MessageContext {
  /** The component name derived from the file path. */
  componentName: string;
  /** The nearest enclosing JSX/HTML element above the call. */
  enclosingElement: string | undefined;
  /** The surrounding code snippet, three lines above and below. */
  snippet: string;
}

/** A single translation request. */
export interface TranslateRequest {
  /** The call-site context. */
  context?: MessageContext | undefined;
  /** The file path the source string came from. */
  fileId: string;
  /** The source string to translate. */
  source: string;
  /** The source locale. */
  sourceLocale: string;
  /** The target locale. */
  targetLocale: string;
}

/**
 * Translates source strings into target locales.
 *
 * Pass to the Vite plugin's `translator` option. Use `createTranslator` to
 * build one — or the built-ins (`anthropic`, `openai`, `gemini`, `ollama`).
 */
export interface Translator {
  (request: TranslateRequest): Promise<string>;
  /** Translates a batch of requests. */
  batch?(requests: TranslateRequest[]): Promise<string[]>;
}
