import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { setLocale } from 'yapyak';

import { useYapyak } from './use-yapyak';

afterEach(() => {
  setLocale('en');
});

describe('useYapyak', () => {
  it('renders without throwing', () => {
    expect(() => renderHook(() => useYapyak())).not.toThrow();
  });

  it('re-renders the host component when the locale changes', () => {
    let renderCount = 0;
    renderHook(() => {
      renderCount += 1;
      useYapyak();
    });
    const before = renderCount;
    act(() => {
      setLocale('sv');
    });
    expect(renderCount).toBeGreaterThan(before);
  });
});
