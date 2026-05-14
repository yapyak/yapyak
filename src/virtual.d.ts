declare module 'virtual:yapyak' {
  export const LOCALES: string[];
  export const DEFAULT_LOCALE: string;
  export const COOKIE_NAME: string;
  export const PERSISTENCE: 'cookie' | 'localStorage' | null;
  export const ACCEPT_LANGUAGE: boolean;
  export const STORAGE_KEY: string;
  export const MANUAL_HTML_LANG: boolean;
}
