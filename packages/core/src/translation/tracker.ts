const trackers = new Set<() => void>();

export function registerTracker(fn: () => void): () => void {
  trackers.add(fn);
  return () => {
    trackers.delete(fn);
  };
}

export function runTrackers(): void {
  for (const tracker of trackers) {
    tracker();
  }
}
