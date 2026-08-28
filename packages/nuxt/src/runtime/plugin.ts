import type { Plugin } from 'nuxt/app';

import { defineNuxtPlugin, useHead } from 'nuxt/app';
import { getLocale, getTextDirection } from 'yapyak';
import { SYNC_HTML_ATTRIBUTES } from 'yapyak/runtime';

const plugin: Plugin = defineNuxtPlugin(() => {
  if (SYNC_HTML_ATTRIBUTES) {
    const locale = getLocale();
    useHead({
      htmlAttrs: {
        dir: getTextDirection(locale),
        lang: locale,
      },
    });
  }
});

export default plugin;
