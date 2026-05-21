import type { Manifest, SidebarNode } from '../types/manifest.ts';

export function getSidebar(
  manifest: Manifest,
  collection: string,
): SidebarNode[] {
  return manifest.collections[collection]?.sidebar ?? [];
}
