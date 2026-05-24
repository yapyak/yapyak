import type { Framework, Processor } from '../type';

import { vanillaProcessor } from './vanilla';
import { vueProcessor } from './vue';

export { vanillaProcessor, vueProcessor };

export function resolveFramework(fileId: string): Framework {
  if (fileId.endsWith('.vue')) return 'vue';
  if (fileId.endsWith('.svelte')) return 'svelte';
  if (fileId.endsWith('.astro')) return 'astro';
  return 'vanilla';
}

export function getProcessor(framework: Framework): Processor {
  switch (framework) {
    case 'vanilla':
      return vanillaProcessor;
    case 'vue':
      return vueProcessor;
    case 'astro':
    case 'svelte':
      throw new Error(`Processor for '${framework}' is not yet implemented.`);
  }
}
