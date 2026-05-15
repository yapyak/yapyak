import type { NitroAppPlugin } from 'nitropack/types';

import { defineNitroPlugin, useEvent } from 'nitropack/runtime';

import { registerRequestHeadersReader } from '../locale/store.js';

/**
 * Nuxt / Nitro plugin that wires yapyak's per-request locale context.
 *
 * Re-export from `server/plugins/yapyak.ts`:
 *
 * @example
 * ```ts
 * // server/plugins/yapyak.ts
 * export { default } from 'yapyak/adapter/nuxt';
 * ```
 *
 * Requires `experimental.asyncContext: true` in `nuxt.config.ts`.
 */
const plugin: NitroAppPlugin = defineNitroPlugin(() => {
  registerRequestHeadersReader(() => {
    let event: ReturnType<typeof useEvent> | undefined;
    try {
      // biome-ignore lint/correctness/useHookAtTopLevel: Nitro useEvent throws outside event context, caught below
      event = useEvent();
    } catch {
      return undefined;
    }
    if (event === undefined) {
      return undefined;
    }
    const headers = event.node.req.headers;
    const acceptLanguage = headers['accept-language'];
    const cookie = headers.cookie;
    return {
      acceptLanguage:
        typeof acceptLanguage === 'string' ? acceptLanguage : undefined,
      cookieHeader: typeof cookie === 'string' ? cookie : undefined,
    };
  });
});

export default plugin;
