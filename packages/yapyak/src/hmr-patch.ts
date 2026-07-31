import type { Template } from './template';

import { setCatalogEntry } from './dev-store';

export type Patch = {
  fileId: string;
  id: string;
  locale: string;
  value: string | Template;
};

export function applyPatches(event: { patches: Patch[] }): void {
  for (const patch of event.patches) {
    setCatalogEntry(patch.fileId, patch.id, patch.locale, patch.value);
  }
}
