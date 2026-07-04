import type { ParsedLocation } from '@tanstack/react-router';

import { useRouter } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';

import { useDocumentEventListener } from './use-document-event-listener';
import { useWindowEventListener } from './use-window-event-listener';

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

function saveCurrentPosition(key: string) {
  saveEntry(key, {
    x: window.scrollX,
    y: window.scrollY,
  });
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
  const currentKeyRef = useRef(getKey(router.state.location));
  const throttleTimeoutRef = useRef<number>(undefined);
  const isPopNavigationRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.history.scrollRestoration = 'manual';
    hydrate();

    const unsubscribeBeforeNavigate = router.subscribe(
      'onBeforeNavigate',
      (event) => {
        if (event.fromLocation === undefined) {
          return;
        }
        saveCurrentPosition(getKey(event.fromLocation));
        if (throttleTimeoutRef.current !== undefined) {
          window.clearTimeout(throttleTimeoutRef.current);
          throttleTimeoutRef.current = undefined;
        }
      },
    );

    const unsubscribeBeforeRouteMount = router.subscribe(
      'onBeforeRouteMount',
      (event) => {
        currentKeyRef.current = getKey(event.toLocation);
        if (isPopNavigationRef.current) {
          const cached = cache.get(currentKeyRef.current);
          if (cached !== undefined) {
            window.scrollTo(cached.x, cached.y);
            return;
          }
        }
        if (event.fromLocation?.pathname === event.toLocation.pathname) {
          return;
        }
        if (scrollToHash(event.toLocation.hash)) {
          return;
        }
        window.scrollTo(0, 0);
      },
    );

    const unsubscribeOnResolved = router.subscribe('onResolved', (event) => {
      currentKeyRef.current = getKey(event.toLocation);
      if (isPopNavigationRef.current) {
        const cached = cache.get(currentKeyRef.current);
        if (cached !== undefined) {
          window.requestAnimationFrame(() => {
            window.scrollTo(cached.x, cached.y);
          });
        }
      }
      isPopNavigationRef.current = false;
    });

    return () => {
      unsubscribeBeforeNavigate();
      unsubscribeBeforeRouteMount();
      unsubscribeOnResolved();
      if (throttleTimeoutRef.current !== undefined) {
        window.clearTimeout(throttleTimeoutRef.current);
      }
      saveCurrentPosition(currentKeyRef.current);
      persist();
    };
  }, [
    router,
  ]);

  const handleScroll = () => {
    if (throttleTimeoutRef.current !== undefined) {
      return;
    }
    throttleTimeoutRef.current = window.setTimeout(() => {
      throttleTimeoutRef.current = undefined;
      saveCurrentPosition(currentKeyRef.current);
    }, THROTTLE_MS);
  };

  const handlePopState = () => {
    isPopNavigationRef.current = true;
  };

  const handlePageHide = () => {
    saveCurrentPosition(currentKeyRef.current);
    persist();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      handlePageHide();
    }
  };

  useWindowEventListener('scroll', handleScroll, {
    passive: true,
  });
  useWindowEventListener('popstate', handlePopState);
  useWindowEventListener('pagehide', handlePageHide);
  useDocumentEventListener('visibilitychange', handleVisibilityChange);
}
