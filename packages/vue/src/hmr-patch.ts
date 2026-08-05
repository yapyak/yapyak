import { applyPatches } from 'yapyak/internal';

if (typeof window !== 'undefined' && import.meta.hot?.on) {
  import.meta.hot.on('yapyak:patch', applyPatches);
}
