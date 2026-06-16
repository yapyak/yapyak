import { describe, expect, it, vi } from 'vitest';

import { yapyak } from './integration';

describe('yapyak', () => {
  it('returns an integration named `@yapyak/astro`', () => {
    expect(yapyak().name).toBe('@yapyak/astro');
  });

  it('binds a hook for `astro:config:setup`', () => {
    expect(yapyak().hooks['astro:config:setup']).toBeInstanceOf(Function);
  });

  it('writes the yapyak Vite plugin into the Astro config on setup', () => {
    const updateConfig = vi.fn();
    const addMiddleware = vi.fn();
    const integration = yapyak();
    const hook = integration.hooks['astro:config:setup'];
    if (!hook) {
      throw new Error('astro:config:setup hook missing');
    }
    void hook({
      addMiddleware,
      updateConfig,
    } as unknown as Parameters<typeof hook>[0]);
    expect(updateConfig).toHaveBeenCalledTimes(1);
    const config = updateConfig.mock.calls[0]?.[0] as {
      vite: {
        plugins: {
          name: string;
        }[];
      };
    };
    const names = config.vite.plugins.map((plugin) => plugin.name);
    expect(names).toContain('yapyak:transform');
  });

  it('writes the `@yapyak/astro/internal` middleware with `pre` order on setup', () => {
    const updateConfig = vi.fn();
    const addMiddleware = vi.fn();
    const integration = yapyak();
    const hook = integration.hooks['astro:config:setup'];
    if (!hook) {
      throw new Error('astro:config:setup hook missing');
    }
    void hook({
      addMiddleware,
      updateConfig,
    } as unknown as Parameters<typeof hook>[0]);
    expect(addMiddleware).toHaveBeenCalledWith({
      entrypoint: '@yapyak/astro/internal',
      order: 'pre',
    });
  });
});
