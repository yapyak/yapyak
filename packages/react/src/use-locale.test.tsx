import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { setLocale } from 'yapyak';

import { useLocale } from './use-locale';

afterEach(() => {
  setLocale('en');
});

describe('useLocale', () => {
  it('returns the current locale as the first tuple entry', () => {
    setLocale('sv');
    const { result } = renderHook(() => useLocale());
    expect(result.current[0]).toBe('sv');
  });

  it('writes the new locale on a call to the setter', () => {
    const { result, rerender } = renderHook(() => useLocale());
    act(() => result.current[1]('sv'));
    rerender();
    expect(result.current[0]).toBe('sv');
  });
});
