import type { NavigationManifest, SidebarNode } from '../build';

export function getSidebarNodes(
  manifest: NavigationManifest,
  collection: string,
): SidebarNode[] {
  return manifest.collections[collection]?.sidebar ?? [];
}
