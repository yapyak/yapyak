import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setLocale } from 'yapyak';

import { useYapyak } from './use-yapyak';

afterEach(() => {
  setLocale('en');
  vi.unstubAllEnvs();
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

  it('falls back to a noop dev subscription when `DEV` is `false`', async () => {
    vi.stubEnv('DEV', false);
    vi.resetModules();
    const { useYapyak: prodUseYapyak } = await import('./use-yapyak');
    const { setVariant } = await import('yapyak/internal');
    let renderCount = 0;
    renderHook(() => {
      renderCount += 1;
      prodUseYapyak();
    });
    const before = renderCount;
    act(() => {
      setVariant('src/a.tsx', 'Save', 'sv', 'Spara');
    });

    expect(renderCount).toBe(before);
  });
});
