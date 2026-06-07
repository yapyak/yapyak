declare global {
  interface ImportMeta {
    hot?: {
      dispose(callback: () => void): void;
    };
  }
}

export function registerHotDispose(
  meta: ImportMeta,
  callback: () => void,
): void {
  meta.hot?.dispose(callback);
}
