import type { Template } from './template';

type Catalog = Record<string, string | Template>;

const catalogs = new Map<string, Catalog>();
const pendingPatches = new Map<string, Map<string, string | Template>>();
const subscribers = new Set<() => void>();
let version = 0;

function makeKey(fileId: string, id: string): string {
  return `${fileId}\0${id}`;
}

function notifyAll(): void {
  version += 1;
  for (const subscriber of subscribers) {
    subscriber();
  }
}

export function bind(fileId: string, id: string, initial: Catalog): Catalog {
  const key = makeKey(fileId, id);
  const existing = catalogs.get(key);
  if (existing) {
    return existing;
  }
  const catalog: Catalog = {
    ...initial,
  };
  const pending = pendingPatches.get(key);
  if (pending) {
    for (const [pendingLocale, pendingValue] of pending) {
      if (pendingValue === '') {
        delete catalog[pendingLocale];
      } else {
        catalog[pendingLocale] = pendingValue;
      }
    }
    pendingPatches.delete(key);
  }
  catalogs.set(key, catalog);
  return catalog;
}

export function patch(
  fileId: string,
  id: string,
  locale: string,
  value: string | Template,
): void {
  const key = makeKey(fileId, id);
  const catalog = catalogs.get(key);
  if (catalog) {
    if (value === '') {
      delete catalog[locale];
    } else {
      catalog[locale] = value;
    }
  } else {
    let pending = pendingPatches.get(key);
    if (!pending) {
      pending = new Map();
      pendingPatches.set(key, pending);
    }
    pending.set(locale, value);
  }
  notifyAll();
}

export function purgeFile(fileId: string): void {
  const prefix = `${fileId}\0`;
  let dirty = false;
  for (const key of catalogs.keys()) {
    if (key.startsWith(prefix)) {
      catalogs.delete(key);
      dirty = true;
    }
  }
  for (const key of pendingPatches.keys()) {
    if (key.startsWith(prefix)) {
      pendingPatches.delete(key);
      dirty = true;
    }
  }
  if (dirty) {
    notifyAll();
  }
}

export function subscribeDev(callback: () => void): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

export function getDevVersion(): number {
  return version;
}

export function resetDevStore(): void {
  catalogs.clear();
  pendingPatches.clear();
  subscribers.clear();
  version = 0;
}
