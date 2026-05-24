import type { Processor, ProcessorKind } from '../type';

import { astroProcessor } from './astro';
import { svelteProcessor } from './svelte';
import { vanillaProcessor } from './vanilla';
import { vueProcessor } from './vue';

export { astroProcessor, svelteProcessor, vanillaProcessor, vueProcessor };

export function resolveProcessorKind(fileId: string): ProcessorKind {
  if (fileId.endsWith('.vue')) return 'vue';
  if (fileId.endsWith('.svelte')) return 'svelte';
  if (fileId.endsWith('.astro')) return 'astro';
  return 'vanilla';
}

export function getProcessor(kind: ProcessorKind): Processor {
  switch (kind) {
    case 'vanilla':
      return vanillaProcessor;
    case 'vue':
      return vueProcessor;
    case 'svelte':
      return svelteProcessor;
    case 'astro':
      return astroProcessor;
  }
}
