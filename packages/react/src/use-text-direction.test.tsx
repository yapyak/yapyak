import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { setLocale } from 'yapyak';

import { useTextDirection } from './use-text-direction';

afterEach(() => {
  setLocale('en');
});

describe('useTextDirection', () => {
  it('returns the text direction for the current locale', () => {
    setLocale('sv');
    const { result } = renderHook(() => useTextDirection());
    expect(result.current).toBe('ltr');
  });

  it('returns `rtl` when the locale changes to an RTL locale', () => {
    const { result, rerender } = renderHook(() => useTextDirection());
    act(() => setLocale('ar'));
    rerender();
    expect(result.current).toBe('rtl');
  });
});
