import type { ParsedLocation } from '@tanstack/react-router';

import { useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';

type ScrollEntry = {
  x: number;
  y: number;
};

const STORAGE_KEY = 'yapyak-scroll-v1';
const MAX_ENTRIES = 50;
const THROTTLE_MS = 100;

const cache = new Map<string, ScrollEntry>();
let isHydrated = false;

function hydrate() {
  if (isHydrated) {
    return;
  }
  isHydrated = true;
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return;
    }
    const parsed = JSON.parse(raw) as Record<string, ScrollEntry>;
    for (const [key, entry] of Object.entries(parsed)) {
      cache.set(key, entry);
    }
  } catch {}
}

function persist() {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const record: Record<string, ScrollEntry> = {};
    for (const [key, entry] of cache) {
      record[key] = entry;
    }
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {}
}

function getKey(location: ParsedLocation): string {
  return location.href;
}

function saveEntry(key: string, entry: ScrollEntry) {
  cache.delete(key);
  cache.set(key, entry);
  if (cache.size > MAX_ENTRIES) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) {
      cache.delete(firstKey);
    }
  }
}

function scrollToHash(hash: string): boolean {
  if (hash === '') {
    return false;
  }
  const id = hash.startsWith('#') ? hash.slice(1) : hash;
  const element = document.getElementById(id);
  if (element === null) {
    return false;
  }
  element.scrollIntoView({
    behavior: 'instant',
  });
  return true;
}

export function useScrollRestoration() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.history.scrollRestoration = 'manual';
    hydrate();

    let throttleTimer: number | undefined;
    let isPopNavigation = false;
    let currentKey = getKey(router.state.location);

    const saveCurrent = () => {
      saveEntry(currentKey, {
        x: window.scrollX,
        y: window.scrollY,
      });
    };

    const handleScroll = () => {
      if (throttleTimer !== undefined) {
        return;
      }
      throttleTimer = window.setTimeout(() => {
        throttleTimer = undefined;
        saveCurrent();
      }, THROTTLE_MS);
    };

    const handlePageHide = () => {
      saveCurrent();
      persist();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handlePageHide();
      }
    };

    const restore = (location: ParsedLocation) => {
      if (isPopNavigation) {
        const cached = cache.get(getKey(location));
        if (cached !== undefined) {
          window.scrollTo(cached.x, cached.y);
          return;
        }
      }
      if (scrollToHash(location.hash)) {
        return;
      }
      window.scrollTo(0, 0);
    };

    const handlePopState = () => {
      isPopNavigation = true;
    };

    const unsubscribeBeforeNavigate = router.subscribe(
      'onBeforeNavigate',
      (event) => {
        if (event.fromLocation === undefined) {
          return;
        }
        saveEntry(getKey(event.fromLocation), {
          x: window.scrollX,
          y: window.scrollY,
        });
        if (throttleTimer !== undefined) {
          window.clearTimeout(throttleTimer);
          throttleTimer = undefined;
        }
      },
    );

    const unsubscribeBeforeRouteMount = router.subscribe(
      'onBeforeRouteMount',
      (event) => {
        currentKey = getKey(event.toLocation);
        restore(event.toLocation);
      },
    );

    const unsubscribeOnResolved = router.subscribe('onResolved', (event) => {
      currentKey = getKey(event.toLocation);
      if (isPopNavigation) {
        const cached = cache.get(currentKey);
        if (cached !== undefined) {
          window.requestAnimationFrame(() => {
            window.scrollTo(cached.x, cached.y);
          });
        }
      }
      isPopNavigation = false;
    });

    window.addEventListener('scroll', handleScroll, {
      passive: true,
    });
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribeBeforeNavigate();
      unsubscribeBeforeRouteMount();
      unsubscribeOnResolved();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (throttleTimer !== undefined) {
        window.clearTimeout(throttleTimer);
      }
      saveCurrent();
      persist();
    };
  }, [
    router,
  ]);
}
