export interface Persistence {
  get(): string | undefined;
  getFromRequest?(request: Request): string | undefined;
  set(locale: string): boolean;
  subscribe?(onChange: () => void): () => void;
}

export type NormalizedPersistence =
  | { type: 'cookie'; name: string }
  | { type: 'local-storage'; key: string }
  | { type: 'url'; match?: RegExp }
  | null;
