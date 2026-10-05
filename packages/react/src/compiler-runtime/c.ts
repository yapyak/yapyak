import { c as useMemoCache } from 'react/compiler-runtime';
import { getLocale } from 'yapyak';
import { getDevVersion } from 'yapyak/internal';

import { useYapyak } from '../use-yapyak';

const MEMO_CACHE_SENTINEL = Symbol.for('react.memo_cache_sentinel');

export function c(size: number): unknown[] {
  useYapyak();
  const locale = getLocale();
  const version = getDevVersion();
  const cache = useMemoCache(size + 2);
  if (cache[size] !== locale || cache[size + 1] !== version) {
    cache.fill(MEMO_CACHE_SENTINEL, 0, size);
    cache[size] = locale;
    cache[size + 1] = version;
  }
  return cache;
}
