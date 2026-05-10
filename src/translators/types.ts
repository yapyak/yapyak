export interface MessageContext {
  componentName: string;
  enclosingElement: string | undefined;
  snippet: string;
}

export interface TranslateRequest {
  context?: MessageContext | undefined;
  fileId: string;
  source: string;
  sourceLocale: string;
  targetLocale: string;
}

export interface Translator {
  (request: TranslateRequest): Promise<string>;
  batch?(requests: TranslateRequest[]): Promise<string[]>;
}
