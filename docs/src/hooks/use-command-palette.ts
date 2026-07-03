import { useDialogTrigger } from '#components/dialog-trigger';

import { useDocumentEventListener } from './use-document-event-listener';
import { useSearch } from './use-search';

export function useCommandPalette() {
  const { dialogProps, isOpen, triggerProps } = useDialogTrigger();
  const searchData = useSearch(isOpen);

  useDocumentEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      triggerProps.onClick();
    }
  });

  return {
    dialogProps,
    searchData,
    triggerProps,
  };
}
