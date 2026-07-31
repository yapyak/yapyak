import type { Anchor, Page } from '@yapyak/docs-compiler';

import { useEffect, useState } from 'react';
import { t } from 'yapyak';

import { AnchorNavigation } from '#components/anchor-navigation';
import { DialogTrigger } from '#components/dialog-trigger';
import { Drawer } from '#components/drawer';
import { Icon } from '#components/icon';
import { IconButton } from '#components/icon-button';
import { PageAction } from '#components/page-action';
import { useMediaQuery } from '#hooks/use-media-query';

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
