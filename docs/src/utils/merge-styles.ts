export function mergeStyles(
  ...styles: unknown[]
): Record<string, number | string> {
  const result: Record<string, number | string> = {};

  function flatten(input: unknown) {
    if (Array.isArray(input)) {
      for (const item of input) {
        flatten(item);
      }
    } else if (input && typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value != null && value !== false) {
          result[key] = value as number | string;
        }
      }
    }
  }

  for (const style of styles) {
    flatten(style);
  }

  return result;
}
