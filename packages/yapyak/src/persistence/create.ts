export interface Persistence {
  get(): string | undefined;
  getFromRequest?(request: Request): string | undefined;
  set(locale: string): boolean;
  subscribe?(onChange: () => void): () => void;
}

export function createPersistence(options: Persistence): Persistence {
  return {
    get: options.get,
    getFromRequest: options.getFromRequest,
    set: options.set,
    subscribe: options.subscribe,
  };
}
