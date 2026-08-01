import type { Anchor, Page } from '@yapyak/docs-compiler';

import { useEffect, useState } from 'react';
import { t } from 'yapyak';

import { useMediaQuery } from '#hooks/use-media-query';

import { AnchorNavigation } from '../anchor-navigation';
import { DialogTrigger } from '../dialog-trigger';
import { Drawer } from '../drawer';
import { Icon } from '../icon';
import { IconButton } from '../icon-button';
import { PageAction } from '../page-action';

export type OutlineDrawerTriggerProps = {
  anchors: Anchor[];
  page: Page;
};

export function OutlineDrawerTrigger(props: OutlineDrawerTriggerProps) {
  const { anchors, page } = props;
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
          aria-label={t('Page')}
          direction="end"
        >
          {anchors.length > 0 && (
            <AnchorNavigation
              anchors={anchors}
              key={page.href}
            />
          )}
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
