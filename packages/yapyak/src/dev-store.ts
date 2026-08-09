import type { Variants } from './translation';

import { registerHotDispose } from './hot-dispose';

const variantsByKey = new Map<string, Variants>();
const pendingPatchesByKey = new Map<string, Map<string, Variants[string]>>();
const subscribers = new Set<() => void>();
let version = 0;

function toStoreKey(fileId: string, id: string): string {
  return `${fileId}\0${id}`;
}

function runSubscribers(): void {
  version += 1;
  for (const subscriber of subscribers) {
    subscriber();
  }
}

export function registerVariants(
  fileId: string,
  id: string,
  initial: Variants,
): Variants {
  const key = toStoreKey(fileId, id);
  const existing = variantsByKey.get(key);
  if (existing) {
    return existing;
  }
  const variants: Variants = {
    ...initial,
  };
  const pending = pendingPatchesByKey.get(key);
  if (pending) {
    for (const [pendingLocale, pendingValue] of pending) {
      if (pendingValue === '') {
        delete variants[pendingLocale];
      } else {
        variants[pendingLocale] = pendingValue;
      }
    }
    pendingPatchesByKey.delete(key);
  }
  variantsByKey.set(key, variants);
  return variants;
}

export function setVariant(
  fileId: string,
  id: string,
  locale: string,
  value: Variants[string],
): void {
  const key = toStoreKey(fileId, id);
  const variants = variantsByKey.get(key);
  if (variants) {
    if (value === '') {
      delete variants[locale];
    } else {
      variants[locale] = value;
    }
  } else {
    let pending = pendingPatchesByKey.get(key);
    if (!pending) {
      pending = new Map();
      pendingPatchesByKey.set(key, pending);
    }
    pending.set(locale, value);
  }
  runSubscribers();
}

export function invalidateFile(fileId: string): void {
  const prefix = `${fileId}\0`;
  let isDirty = false;
  for (const key of variantsByKey.keys()) {
    if (key.startsWith(prefix)) {
      variantsByKey.delete(key);
      isDirty = true;
    }
  }
  for (const key of pendingPatchesByKey.keys()) {
    if (key.startsWith(prefix)) {
      pendingPatchesByKey.delete(key);
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
  variantsByKey.clear();
  pendingPatchesByKey.clear();
  subscribers.clear();
  version = 0;
}
