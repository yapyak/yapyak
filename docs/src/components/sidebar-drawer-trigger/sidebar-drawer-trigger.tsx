import type { ReactNode } from 'react';

import { useEffect, useState } from 'react';
import { t } from 'yapyak';

import { DialogTrigger } from '#components/dialog-trigger';
import { Drawer } from '#components/drawer';
import { Icon } from '#components/icon';
import { IconButton } from '#components/icon-button';
import { useMediaQuery } from '#hooks/use-media-query';

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
