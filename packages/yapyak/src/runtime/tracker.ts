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
