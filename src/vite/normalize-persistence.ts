export type Persistence =
  | 'cookie'
  | 'localStorage'
  | null
  | { type: 'cookie'; name: string }
  | { type: 'localStorage'; key: string };

export type ResolvedPersistence =
  | { type: 'cookie'; name: string }
  | { type: 'localStorage'; key: string }
  | { type: 'none' };

export function normalizePersistence(
  persistence: Persistence | undefined,
): ResolvedPersistence {
  if (persistence === null || persistence === undefined) {
    return { type: 'none' };
  }
  if (persistence === 'cookie') {
    return { type: 'cookie', name: 'locale' };
  }
  if (persistence === 'localStorage') {
    return { type: 'localStorage', key: 'locale' };
  }
  return persistence;
}
