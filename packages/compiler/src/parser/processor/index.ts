import type { Processor, ProcessorKind } from '../type';

import { vanillaProcessor } from './vanilla';
import { vueProcessor } from './vue';

export { vanillaProcessor, vueProcessor };

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
    case 'astro':
    case 'svelte':
      throw new Error(`Processor for '${kind}' is not yet implemented.`);
  }
}
