export type Persistence =
  | 'cookie'
  | 'localStorage'
  | false
  | { type: 'cookie'; name: string }
  | { type: 'localStorage'; key: string };

export type ResolvedPersistence =
  | { type: 'cookie'; name: string }
  | { type: 'localStorage'; key: string }
  | { type: 'none' };

export function normalizePersistence(
  persistence: Persistence | undefined,
): ResolvedPersistence {
  if (persistence === false) {
    return { type: 'none' };
  }
  if (persistence === undefined || persistence === 'cookie') {
    return { type: 'cookie', name: 'locale' };
  }
  if (persistence === 'localStorage') {
    return { type: 'localStorage', key: 'locale' };
  }
  return persistence;
}
