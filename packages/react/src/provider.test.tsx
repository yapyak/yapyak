import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLocale, setLocale } from 'yapyak';
import { setVariant } from 'yapyak/internal';

import { YapyakProvider } from './provider';
import { useYapyak } from './use-yapyak';

afterEach(() => {
  setLocale('en');
  vi.unstubAllEnvs();
});

describe('YapyakProvider', () => {
  it('renders its children', () => {
    const { container } = render(<YapyakProvider>Hello</YapyakProvider>);
    expect(container.textContent).toBe('Hello');
  });

  it('re-renders a host component when the locale changes', () => {
    const Host = (): string => {
      useYapyak();
      return getLocale();
    };
    const { container } = render(
      <YapyakProvider>
        <Host />
      </YapyakProvider>,
    );
    act(() => {
      setLocale('sv');
    });
    expect(container.textContent).toBe('sv');
  });

  it('re-renders a host component when a dev translation changes', () => {
    let renderCount = 0;
    const Host = (): null => {
      renderCount += 1;
      useYapyak();
      return null;
    };
    render(
      <YapyakProvider>
        <Host />
      </YapyakProvider>,
    );
    const before = renderCount;
    act(() => {
      setVariant('src/a.tsx', 'Save', 'sv', 'Spara');
    });
    expect(renderCount).toBeGreaterThan(before);
  });

  it('falls back to a noop dev subscription when `DEV` is `false`', async () => {
    vi.stubEnv('DEV', false);
    vi.resetModules();
    const { YapyakProvider: ProdYapyakProvider } = await import('./provider');
    const { useYapyak: prodUseYapyak } = await import('./use-yapyak');
    const { setVariant: prodSetVariant } = await import('yapyak/internal');
    let renderCount = 0;
    const Host = (): null => {
      renderCount += 1;
      prodUseYapyak();
      return null;
    };
    render(
      <ProdYapyakProvider>
        <Host />
      </ProdYapyakProvider>,
    );
    const before = renderCount;
    act(() => {
      prodSetVariant('src/a.tsx', 'Save', 'sv', 'Spara');
    });
    expect(renderCount).toBe(before);
  });
});
