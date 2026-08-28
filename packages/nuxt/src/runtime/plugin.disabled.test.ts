import { useHead } from 'nuxt/app';
import { describe, expect, it, vi } from 'vitest';

import plugin from './plugin';

vi.mock('nuxt/app', () => ({
  defineNuxtPlugin: (definition: unknown) => definition,
  useHead: vi.fn(),
}));

vi.mock('yapyak/runtime', () => ({
  DEFAULT_LOCALE: 'en',
  DETECT_USER_LOCALE: false,
  LOCALES: [
    'en',
    'sv',
  ],
  PERSISTENCE_CONFIG: {
    name: 'locale',
    type: 'cookie',
  },
  SYNC_HTML_ATTRIBUTES: false,
}));

describe('plugin', () => {
  it('skips the head write with `syncHtmlAttributes` off', () => {
    (plugin as () => void)();

    expect(useHead).not.toHaveBeenCalled();
  });
});
