export function stringifyCanonical(value: unknown): string {
  return `${JSON.stringify(value, sortKeys, 2)}\n`;
}

function sortKeys(_: string, current: unknown): unknown {
  if (
    current === null ||
    typeof current !== 'object' ||
    Array.isArray(current)
  ) {
    return current;
  }
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(current as object).sort(compareKeys)) {
    sorted[key] = (current as Record<string, unknown>)[key];
  }
  return sorted;
}

export function compareKeys(a: string, b: string): number {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  if (aLower !== bLower) {
    return aLower < bLower ? -1 : 1;
  }
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}
