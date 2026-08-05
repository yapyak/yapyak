import type { ReactNode } from 'react';

import { useEffect, useState } from 'react';
import { t } from 'yapyak';

import { useMediaQuery } from '#hooks/use-media-query';

import { DialogTrigger } from '../dialog-trigger';
import { Drawer } from '../drawer';
import { Icon } from '../icon';
import { IconButton } from '../icon-button';

export type SidebarDrawerTriggerProps = {
  drawer: ReactNode;
};

export function SidebarDrawerTrigger(props: SidebarDrawerTriggerProps) {
  const { drawer } = props;
  const isSidebarInline = useMediaQuery('(min-width: 1024px)');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isSidebarInline) {
      setIsOpen(false);
    }
  }, [
    isSidebarInline,
  ]);

  return (
    <DialogTrigger
      dialog={(dialogProps) => (
        <Drawer
          {...dialogProps}
          aria-label={t('Menu')}
          direction="start"
        >
          {drawer}
        </Drawer>
      )}
      onOpenChange={setIsOpen}
      open={isOpen}
    >
      {(triggerProps) => (
        <IconButton
          {...triggerProps}
          icon={<Icon name="menu" />}
        >
          {t('Menu')}
        </IconButton>
      )}
    </DialogTrigger>
  );
}
