export function mergeClassNames(...classNames: unknown[]) {
  const result: string[] = [];

  function flatten(input: unknown) {
    if (Array.isArray(input)) {
      for (const item of input) {
        flatten(item);
      }
    } else if (
      typeof input === 'string' ||
      typeof input === 'number' ||
      typeof input === 'boolean'
    ) {
      if (input) {
        result.push(String(input));
      }
    }
  }

  for (const name of classNames) {
    flatten(name);
  }

  return result.length > 0 ? result.join(' ') : undefined;
}
