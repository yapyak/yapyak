import type { Manifest } from '../build/manifest';
import type { OptionsGroup, OptionsRegistry } from '../config';

export function getOptions(manifest: Manifest): OptionsRegistry {
  return manifest.options;
}

export function getOptionsGroup(
  manifest: Manifest,
  groupId: string,
): OptionsGroup | null {
  return manifest.options[groupId] ?? null;
}
