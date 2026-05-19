// Framework adapters (Vue/Svelte) register a no-op that reads a reactive
// value. Calling these inside t() forces a reactive subscription so that
// components re-render when the locale changes — even when they only call
// t() and never explicitly read locale.
const trackers = new Set<() => void>();

/** @internal */
export function registerTracker(fn: () => void): () => void {
  trackers.add(fn);
  return () => {
    trackers.delete(fn);
  };
}

/** @internal */
export function runTrackers(): void {
  for (const tracker of trackers) {
    tracker();
  }
}
