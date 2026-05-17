import { buildReferenceSidebar } from '#docs/build-reference-sidebar.server';
import { loadManifest } from '#docs/load-manifest.server';

export async function loadReferenceSidebar() {
  const manifest = await loadManifest(process.cwd());
  return buildReferenceSidebar(manifest);
}
