import type { Page } from '@yapyak/doc-compiler';

import { useEffect, useState } from 'react';
import { t } from 'yapyak';

import { DialogTrigger } from '#components/dialog-trigger';
import { Drawer } from '#components/drawer';
import { Icon } from '#components/icon';
import { IconButton } from '#components/icon-button';
import { PageAction } from '#components/page-action';
import { PageAnchorNavigation } from '#components/page-anchor-navigation';
import { useMediaQuery } from '#hooks/use-media-query';

export type OutlineDrawerTriggerProps = {
  page: Page;
};

export function OutlineDrawerTrigger(props: OutlineDrawerTriggerProps) {
  const { page } = props;
  const isOutlineInline = useMediaQuery('(min-width: 1324px)');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOutlineInline) {
      setIsOpen(false);
    }
  }, [
    isOutlineInline,
  ]);

  return (
    <DialogTrigger
      dialog={(dialogProps) => (
        <Drawer
          {...dialogProps}
          direction="end"
        >
          <PageAnchorNavigation
            key={page.href}
            page={page}
          />
          <PageAction page={page} />
        </Drawer>
      )}
      onOpenChange={setIsOpen}
      open={isOpen}
    >
      {(triggerProps) => (
        <IconButton
          {...triggerProps}
          icon={<Icon name="page" />}
          iconPosition="trailing"
        >
          {t('Page')}
        </IconButton>
      )}
    </DialogTrigger>
  );
}
