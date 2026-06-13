declare global {
  // biome-ignore lint/style/useConsistentTypeDefinitions: yap yap yap
  interface ImportMeta {
    env?: {
      // biome-ignore lint/style/useNamingConvention: yap yap yap
      DEV?: boolean;
    };
    hot?: {
      accept?(callback?: () => void): void;
      dispose(callback: () => void): void;
      on?<T>(event: string, callback: (data: T) => void): void;
    };
  }
}

export function registerHotDispose(
  meta: ImportMeta,
  callback: () => void,
): void {
  meta.hot?.dispose(callback);
}
