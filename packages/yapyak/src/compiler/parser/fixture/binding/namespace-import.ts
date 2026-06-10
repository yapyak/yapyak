// biome-ignore lint/performance/noNamespaceImport: yap yap yap
import * as Y from 'yapyak';

export function greeting(): string {
  return Y.t('Hello');
}
