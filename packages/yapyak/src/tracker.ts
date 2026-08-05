import { warnDiagnostic } from './diagnostic';
import { registerHotDispose } from './hot-dispose';

const trackers = new Set<() => void>();

export function registerTracker(tracker: () => void): () => void {
  trackers.add(tracker);
  return () => {
    trackers.delete(tracker);
  };
}

export function autoRegisterTracker(
  meta: ImportMeta,
  tracker: () => void,
): void {
  const unregister = registerTracker(tracker);
  registerHotDispose(meta, unregister);
}

export function runTrackers(): void {
  for (const tracker of trackers) {
    try {
      tracker();
    } catch (cause) {
      warnDiagnostic('TRACKER_THREW', undefined, {
        cause,
      });
    }
  }
}
