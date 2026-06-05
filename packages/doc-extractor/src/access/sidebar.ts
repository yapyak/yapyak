import type { Manifest, SidebarNode } from '../build/manifest';

export function getSidebar(
  manifest: Manifest,
  collection: string,
): SidebarNode[] {
  return manifest.collections[collection]?.sidebar ?? [];
}
