import type { NavigationManifest } from '../build';
import type { OptionsGroup, OptionsRegistry } from '../config';

export function getOptions(manifest: NavigationManifest): OptionsRegistry {
  return manifest.options;
}

export function getOptionsGroup(
  manifest: NavigationManifest,
  groupId: string,
): OptionsGroup | undefined {
  return manifest.options[groupId];
}
