import { setCatalogEntry } from 'yapyak/internal';

type Patch = {
  fileId: string;
  id: string;
  locale: string;
  value: string | unknown[];
};

if (typeof window !== 'undefined' && import.meta.hot?.on) {
  import.meta.hot.on('yapyak:patch', (data: { patches: Patch[] }) => {
    for (const item of data.patches) {
      setCatalogEntry(
        item.fileId,
        item.id,
        item.locale,
        item.value as Parameters<typeof setCatalogEntry>[3],
      );
    }
  });
}
