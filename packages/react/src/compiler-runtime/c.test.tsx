import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { setLocale } from 'yapyak';
import { setVariant } from 'yapyak/internal';

import { c } from './c';

const MEMO_CACHE_SENTINEL = Symbol.for('react.memo_cache_sentinel');

afterEach(() => {
  setLocale('en');
});

function renderCachedValue() {
  let computeCount = 0;
  const rendered = renderHook(() => {
    const cache = c(1);
    if (cache[0] === MEMO_CACHE_SENTINEL) {
      computeCount += 1;
      cache[0] = 'Hello';
    }
    return cache[0];
  });
  return {
    ...rendered,
    getComputeCount: () => computeCount,
  };
}

describe('c', () => {
  it('returns a cache whose slots hold the memo sentinel', () => {
    const { result } = renderHook(() => c(2));

    expect(result.current[0]).toBe(MEMO_CACHE_SENTINEL);
    expect(result.current[1]).toBe(MEMO_CACHE_SENTINEL);
  });

  it('preserves cached slots across a re-render', () => {
    const { getComputeCount, rerender, result } = renderCachedValue();

    rerender();

    expect(result.current).toBe('Hello');
    expect(getComputeCount()).toBe(1);
  });

  it('clears cached slots when the locale changes', () => {
    const { getComputeCount } = renderCachedValue();

    act(() => {
      setLocale('sv');
    });

    expect(getComputeCount()).toBe(2);
  });

  it('clears cached slots when a dev variant changes', () => {
    const { getComputeCount } = renderCachedValue();

    act(() => {
      setVariant('src/a.tsx', 'Hello', 'sv', 'Hej');
    });

    expect(getComputeCount()).toBe(2);
  });
});
