import type { Template } from './template';

import { registerHotDispose } from './hot-dispose';

type Catalog = Record<string, string | Template>;

const catalogs = new Map<string, Catalog>();
const pendingPatches = new Map<string, Map<string, string | Template>>();
const subscribers = new Set<() => void>();
let version = 0;

function makeKey(fileId: string, id: string): string {
  return `${fileId}\0${id}`;
}

function runSubscribers(): void {
  version += 1;
  for (const subscriber of subscribers) {
    subscriber();
  }
}

export function registerCatalog(
  fileId: string,
  id: string,
  initial: Catalog,
): Catalog {
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

export function setCatalogEntry(
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
  runSubscribers();
}

export function invalidateFile(fileId: string): void {
  const prefix = `${fileId}\0`;
  let isDirty = false;
  for (const key of catalogs.keys()) {
    if (key.startsWith(prefix)) {
      catalogs.delete(key);
      isDirty = true;
    }
  }
  for (const key of pendingPatches.keys()) {
    if (key.startsWith(prefix)) {
      pendingPatches.delete(key);
      isDirty = true;
    }
  }
  if (isDirty) {
    runSubscribers();
  }
}

export function subscribeDev(callback: () => void): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

export function autoSubscribeDev(meta: ImportMeta, callback: () => void): void {
  const unsubscribe = subscribeDev(callback);
  registerHotDispose(meta, unsubscribe);
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
