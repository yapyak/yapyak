export interface MessagePosition {
  column: number;
  line: number;
  source: string;
}

export interface Rename {
  from: string;
  to: string;
}

export function detectRenames(
  oldEntries: MessagePosition[],
  newEntries: MessagePosition[],
): Rename[] {
  const oldSources = new Set<string>();
  for (const entry of oldEntries) {
    oldSources.add(entry.source);
  }
  const newSources = new Set<string>();
  for (const entry of newEntries) {
    newSources.add(entry.source);
  }

  const removed = new Set<string>();
  for (const source of oldSources) {
    if (!newSources.has(source)) {
      removed.add(source);
    }
  }

  const added = new Set<string>();
  for (const source of newSources) {
    if (!oldSources.has(source)) {
      added.add(source);
    }
  }

  if (removed.size === 0 || added.size === 0) {
    return [];
  }

  const newByPosition = new Map<string, string>();
  for (const entry of newEntries) {
    if (added.has(entry.source)) {
      newByPosition.set(positionKey(entry), entry.source);
    }
  }

  const renames: Rename[] = [];
  const claimedAdded = new Set<string>();

  for (const oldEntry of oldEntries) {
    if (!removed.has(oldEntry.source)) {
      continue;
    }
    const candidate = newByPosition.get(positionKey(oldEntry));
    if (candidate === undefined) {
      continue;
    }
    if (claimedAdded.has(candidate)) {
      continue;
    }
    renames.push({ from: oldEntry.source, to: candidate });
    claimedAdded.add(candidate);
  }

  return renames;
}

function positionKey(entry: MessagePosition): string {
  return `${entry.line}:${entry.column}`;
}
