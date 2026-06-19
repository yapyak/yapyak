import type { Manifest } from '../build';
import type { OptionsGroup, OptionsRegistry } from '../config';

export function getOptions(manifest: Manifest): OptionsRegistry {
  return manifest.options;
}

export function getOptionsGroup(
  manifest: Manifest,
  groupId: string,
): OptionsGroup | undefined {
  return manifest.options[groupId];
}
