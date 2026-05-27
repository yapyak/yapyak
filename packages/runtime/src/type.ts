export type NormalizedPersistence =
  | { type: 'cookie'; name: string }
  | { type: 'localStorage'; key: string }
  | { type: 'url'; match?: RegExp }
  | null;
