import { useDialogTrigger } from '#components/dialog-trigger';

import { useDocumentEventListener } from './use-document-event-listener';
import { useSearchData } from './use-search-data';

export function useSearchDialog() {
  const { dialogProps, isOpen, triggerProps } = useDialogTrigger();
  const searchData = useSearchData(isOpen);

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
