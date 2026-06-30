// biome-ignore lint/suspicious/noExplicitAny: yap yap yap
export function mergeEvents<T extends (...args: any[]) => void>(
  ...callbacks: ((null | T | undefined)[] | null | T | undefined)[]
): T {
  const flatCallbacks: T[] = [];

  function flatten(input: (null | T | undefined)[] | null | T | undefined) {
    if (Array.isArray(input)) {
      for (const item of input) {
        flatten(item);
      }
    } else if (input) {
      flatCallbacks.push(input);
    }
  }

  for (const callback of callbacks) {
    flatten(callback);
  }

  return ((...args: Parameters<T>) => {
    for (const callback of flatCallbacks) {
      callback(...args);
    }
  }) as T;
}
