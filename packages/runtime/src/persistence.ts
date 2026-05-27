export type NormalizedPersistence =
  | { type: 'cookie'; name: string }
  | { type: 'localStorage'; key: string }
  | { type: 'url'; match?: RegExp }
  | null;

export function emitPersistence(persistence: NormalizedPersistence): string {
  if (persistence === null) {
    return 'null';
  }
  if (persistence.type === 'cookie') {
    return `{ type: 'cookie', name: ${JSON.stringify(persistence.name)} }`;
  }
  if (persistence.type === 'localStorage') {
    return `{ type: 'localStorage', key: ${JSON.stringify(persistence.key)} }`;
  }
  if (!persistence.match) {
    return `{ type: 'url' }`;
  }
  return `{ type: 'url', match: new RegExp(${JSON.stringify(persistence.match.source)}, ${JSON.stringify(persistence.match.flags)}) }`;
}
