export interface TranslateRequest {
  fileId: string;
  key: string;
  source: string;
  sourceLocale: string;
  targetLocale: string;
}

export interface Translator {
  (request: TranslateRequest): Promise<string>;
  batch?(requests: TranslateRequest[]): Promise<string[]>;
}
