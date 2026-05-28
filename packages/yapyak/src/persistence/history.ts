export function subscribeHistory(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange);
  const originalPushState = window.history.pushState.bind(window.history);
  const originalReplaceState = window.history.replaceState.bind(window.history);
  window.history.pushState = (
    ...args: Parameters<typeof window.history.pushState>
  ): void => {
    originalPushState(...args);
    onChange();
  };
  window.history.replaceState = (
    ...args: Parameters<typeof window.history.replaceState>
  ): void => {
    originalReplaceState(...args);
    onChange();
  };
  return (): void => {
    window.removeEventListener('popstate', onChange);
    window.history.pushState = originalPushState;
    window.history.replaceState = originalReplaceState;
  };
}
