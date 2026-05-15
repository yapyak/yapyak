declare module 'virtual:yapyak' {
  export const LOCALES: string[];
  export const DEFAULT_LOCALE: string;
  export const PERSISTENCE:
    | { type: 'cookie'; name: string }
    | { type: 'localStorage'; key: string }
    | null;
  export const ACCEPT_LANGUAGE: boolean;
  export const SYNC_HTML_LANG: boolean;
  export const LOADERS: Record<
    string,
    () => Promise<{
      default: Record<string, Record<string, string>>;
    }>
  >;
}

declare module 'virtual:yapyak/locales/*' {
  const data: Record<string, Record<string, string>>;
  export default data;
}
