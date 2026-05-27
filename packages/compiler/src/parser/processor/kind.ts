import type MagicString from 'magic-string';
import type { Fragment } from '../fragment';

import { astroProcessor } from './astro';
import { svelteProcessor } from './svelte';
import { vanillaProcessor } from './vanilla';
import { vueProcessor } from './vue';

export type ProcessorKind = 'astro' | 'svelte' | 'vanilla' | 'vue';

export interface Processor {
  applyImport(
    magicString: MagicString,
    source: string,
    importStatement: string,
  ): void;
  parseFragments(source: string): Fragment[];
}

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
