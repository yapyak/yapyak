import { registerHotDispose } from './hot-dispose';

const trackers = new Set<() => void>();

export function registerTracker(fn: () => void): () => void {
  trackers.add(fn);
  return () => {
    trackers.delete(fn);
  };
}

export function autoRegisterTracker(meta: ImportMeta, fn: () => void): void {
  const unregister = registerTracker(fn);
  registerHotDispose(meta, unregister);
}

export function runTrackers(): void {
  for (const tracker of trackers) {
    tracker();
  }
}
