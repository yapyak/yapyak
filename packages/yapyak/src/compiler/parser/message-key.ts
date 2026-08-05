export function toMessageKey(source: string, context?: string): string {
  return JSON.stringify([
    source.normalize(),
    context === undefined ? null : context.normalize(),
  ]);
}

export function fromMessageKey(key: string): {
  context?: string;
  source: string;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(key);
  } catch {
    return {
      source: key,
    };
  }
  if (!Array.isArray(parsed)) {
    return {
      source: key,
    };
  }
  const source = parsed[0];
  if (typeof source !== 'string') {
    return {
      source: key,
    };
  }
  const context = parsed[1];
  if (typeof context === 'string') {
    return {
      context,
      source,
    };
  }
  return {
    source,
  };
}
