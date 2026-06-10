// biome-ignore lint/performance/noNamespaceImport: needed
import * as Y from 'yapyak';

export function greeting(): string {
  return Y.t('Hello');
}
