const listeners = new Set<() => void>();
let patch:
  | {
      pushState: typeof window.history.pushState;
      replaceState: typeof window.history.replaceState;
    }
  | undefined;

function runListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeHistory(onChange: () => void): () => void {
  if (!patch) {
    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(
      window.history,
    );
    patch = {
      pushState: originalPushState,
      replaceState: originalReplaceState,
    };
    window.history.pushState = (
      ...args: Parameters<typeof window.history.pushState>
    ): void => {
      originalPushState(...args);
      runListeners();
    };
    window.history.replaceState = (
      ...args: Parameters<typeof window.history.replaceState>
    ): void => {
      originalReplaceState(...args);
      runListeners();
    };
  }
  window.addEventListener('popstate', onChange);
  listeners.add(onChange);
  return (): void => {
    window.removeEventListener('popstate', onChange);
    listeners.delete(onChange);
    if (listeners.size === 0 && patch) {
      window.history.pushState = patch.pushState;
      window.history.replaceState = patch.replaceState;
      patch = undefined;
    }
  };
}
