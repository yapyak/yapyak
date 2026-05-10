export interface TranslateRequest {
  fileId: string;
  key: string;
  source: string;
  sourceLocale: string;
  targetLocale: string;
}

export type Translator = (request: TranslateRequest) => Promise<string>;
