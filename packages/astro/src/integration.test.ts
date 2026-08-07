import type { AstroIntegration } from 'astro';
import type { Mock } from 'vitest';

import { yapyak as yapyakVite } from '@yapyak/vite';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { yapyak } from './integration';

vi.mock('@yapyak/vite', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@yapyak/vite')>();
  return {
    yapyak: vi.fn(actual.yapyak),
  };
});

type ConfigSetupHook = NonNullable<
  AstroIntegration['hooks']['astro:config:setup']
>;

type ConfigSetupOptions = Parameters<ConfigSetupHook>[0];

describe('yapyak', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('with defaults', () => {
    it('returns an integration named `@yapyak/astro`', () => {
      expect(yapyak().name).toBe('@yapyak/astro');
    });

    it('binds a hook for `astro:config:setup`', () => {
      expect(yapyak().hooks['astro:config:setup']).toBeInstanceOf(Function);
    });

    it('forwards no options to the yapyak Vite plugin', () => {
      invokeConfigSetup(yapyak());

      expect(yapyakVite).toHaveBeenCalledWith({});
    });

    it('writes the yapyak Vite plugin into the Astro config on setup', () => {
      const { updateConfig } = invokeConfigSetup(yapyak());

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
      const { addMiddleware } = invokeConfigSetup(yapyak());

      expect(addMiddleware).toHaveBeenCalledWith({
        entrypoint: '@yapyak/astro/internal',
        order: 'pre',
      });
    });
  });

  describe('with overrides', () => {
    it('forwards `fixedLocale` to the yapyak Vite plugin', () => {
      invokeConfigSetup(
        yapyak({
          fixedLocale: 'sv',
        }),
      );

      expect(yapyakVite).toHaveBeenCalledWith({
        fixedLocale: 'sv',
      });
    });
  });
});

function invokeConfigSetup(integration: AstroIntegration): {
  addMiddleware: Mock<ConfigSetupOptions['addMiddleware']>;
  updateConfig: Mock<ConfigSetupOptions['updateConfig']>;
} {
  const addMiddleware = vi.fn<ConfigSetupOptions['addMiddleware']>();
  const updateConfig = vi.fn<ConfigSetupOptions['updateConfig']>();
  const hook = integration.hooks['astro:config:setup'];
  if (!hook) {
    throw new Error('astro:config:setup hook missing');
  }
  const options: Pick<ConfigSetupOptions, 'addMiddleware' | 'updateConfig'> = {
    addMiddleware,
    updateConfig,
  };
  void hook(options as ConfigSetupOptions);
  return {
    addMiddleware,
    updateConfig,
  };
}
