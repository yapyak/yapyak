export interface Persistence {
  get(): string | undefined;
  getFromRequest?(request: Request): string | undefined;
  set(locale: string): boolean;
  subscribe?(onChange: () => void): () => void;
}

interface CreatePersistenceOptions {
  get(): string | undefined;
  getFromRequest?(request: Request): string | undefined;
  set(locale: string): boolean | void;
  subscribe?(onChange: () => void): () => void;
}

export function createPersistence(
  options: CreatePersistenceOptions,
): Persistence {
  return {
    get: options.get,
    getFromRequest: options.getFromRequest,
    set: (locale) => options.set(locale) === true,
    subscribe: options.subscribe,
  };
}
