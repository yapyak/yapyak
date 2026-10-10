import { act, render, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setLocale } from 'yapyak';

import { YapyakProvider } from './provider';
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

  it('re-renders the host component when the locale changes below `YapyakProvider`', () => {
    let renderCount = 0;
    renderHook(
      () => {
        renderCount += 1;
        useYapyak();
      },
      {
        wrapper: YapyakProvider,
      },
    );
    const before = renderCount;
    act(() => {
      setLocale('sv');
    });
    expect(renderCount).toBeGreaterThan(before);
  });

  it('renders a host called as a plain function a growing number of times below `YapyakProvider`', () => {
    let addRow = (): void => undefined;
    const Row = (): string => {
      useYapyak();
      return 'Hello';
    };
    const List = (): string[] => {
      useYapyak();
      const [count, setCount] = useState(1);
      addRow = (): void => setCount(count + 1);
      return Array.from(
        {
          length: count,
        },
        Row,
      );
    };
    const { container } = render(
      <YapyakProvider>
        <List />
      </YapyakProvider>,
    );
    act(() => {
      addRow();
    });
    expect(container.textContent).toBe('HelloHello');
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
