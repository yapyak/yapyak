import type { Template } from './template/internal';

import { setVariant } from './dev-store';

export type Patch = {
  fileId: string;
  id: string;
  locale: string;
  value: string | Template;
};

export function applyPatches(event: { patches: Patch[] }): void {
  for (const patch of event.patches) {
    setVariant(patch.fileId, patch.id, patch.locale, patch.value);
  }
}
