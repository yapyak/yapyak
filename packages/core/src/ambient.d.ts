declare module 'virtual:yapyak' {
  export const LOCALES: string[];
  export const DEFAULT_LOCALE: string;
  export const PERSISTENCE: import('./persistence').SerializedPersistence;
  export const DETECT_ACCEPT_LANGUAGE: boolean;
  export const SYNC_HTML_LANG: boolean;
}
