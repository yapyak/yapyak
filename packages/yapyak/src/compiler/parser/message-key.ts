const MESSAGE_KEY_SEPARATOR = '@';

export function toMessageKey(source: string, context?: string): string {
  if (context === undefined) {
    return source;
  }
  return `${source}${MESSAGE_KEY_SEPARATOR}${context}`;
}

export function parseMessageKey(key: string): {
  context?: string;
  source: string;
} {
  const index = key.indexOf(MESSAGE_KEY_SEPARATOR);
  if (index === -1) {
    return { source: key };
  }
  return {
    context: key.slice(index + 1),
    source: key.slice(0, index),
  };
}
