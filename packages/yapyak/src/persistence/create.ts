export interface Persistence {
  get(): string | undefined;
  getFromRequest?(request: Request): string | undefined;
  set(locale: string): boolean;
}

interface CreatePersistenceOptions {
  get(): string | undefined;
  getFromRequest?(request: Request): string | undefined;
  set(locale: string): boolean | void;
}

export function createPersistence(
  options: CreatePersistenceOptions,
): Persistence {
  return {
    get: options.get,
    getFromRequest: options.getFromRequest,
    set: (locale) => options.set(locale) === true,
  };
}
