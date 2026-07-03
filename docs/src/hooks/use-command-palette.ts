import { useDialogTrigger } from '#components/dialog-trigger';

import { useDocumentEventListener } from './use-document-event-listener';
import { useSearchIndex } from './use-search-index';

export function useCommandPalette() {
  const { dialogProps, isOpen, triggerProps } = useDialogTrigger();
  const index = useSearchIndex(isOpen);

  useDocumentEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      triggerProps.onClick();
    }
  });

  return {
    dialogProps,
    index,
    triggerProps,
  };
}
