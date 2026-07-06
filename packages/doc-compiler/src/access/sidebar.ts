import type { NavigationManifest, SidebarNode } from '../build';

export function getSidebar(
  manifest: NavigationManifest,
  collection: string,
): SidebarNode[] {
  return manifest.collections[collection]?.sidebar ?? [];
}
