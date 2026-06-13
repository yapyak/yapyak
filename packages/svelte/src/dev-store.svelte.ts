import {
  autoRegisterTracker,
  getDevVersion,
  invalidateFile,
  setCatalogEntry,
  subscribeDev,
} from 'yapyak/internal';

type Patch = {
  fileId: string;
  id: string;
  locale: string;
  value: string | unknown[];
};

let active = $state(getDevVersion());

if (typeof window !== 'undefined') {
  subscribeDev(() => {
    active = getDevVersion();
  });
  autoRegisterTracker(import.meta, () => {
    void active;
  });
  if (import.meta.hot?.on) {
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
    import.meta.hot.on('yapyak:invalidate', (data: { fileId: string }) => {
      invalidateFile(data.fileId);
    });
  }
}
