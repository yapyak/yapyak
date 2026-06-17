export function registerHotDispose(
  meta: ImportMeta,
  callback: () => void,
): void {
  meta.hot?.dispose(callback);
}
