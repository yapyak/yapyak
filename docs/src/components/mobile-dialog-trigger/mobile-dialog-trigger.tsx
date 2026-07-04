import { useEffect } from 'react';

import { MobileDialog } from '#components/mobile-dialog';
import { MobileDialogButton } from '#components/mobile-dialog-button';
import { KEY_MAP } from '#constants';
import { useDocumentEventListener } from '#hooks/use-document-event-listener';
import { useLockBodyScroll } from '#hooks/use-lock-body-scroll';
import { useMediaQuery } from '#hooks/use-media-query';
import { useOnRouteChange } from '#hooks/use-on-route-change';

export type MobileDialogTriggerProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function MobileDialogTrigger(props: MobileDialogTriggerProps) {
  const { onOpenChange, open } = props;
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  useLockBodyScroll({
    enabled: open,
  });

  useOnRouteChange(() => {
    onOpenChange(false);
  });

  useEffect(() => {
    if (isDesktop) {
      onOpenChange(false);
    }
  }, [
    isDesktop,
    onOpenChange,
  ]);

  useDocumentEventListener('keydown', (event) => {
    if (open && event.key === KEY_MAP.escape) {
      onOpenChange(false);
    }
  });

  const handleToggle = () => {
    onOpenChange(!open);
  };

  return (
    <>
      <MobileDialogButton
        onToggle={handleToggle}
        open={open}
      />
      <MobileDialog open={open} />
    </>
  );
}
