import type { Page } from '@yapyak/doc-compiler';

import { getHeadings } from '@yapyak/doc-compiler';
import { useEffect, useMemo, useState } from 'react';
import { t } from 'yapyak';

import { ContentAnchorNavigation } from '#components/content-anchor-navigation';
import { DialogTrigger } from '#components/dialog-trigger';
import { Drawer } from '#components/drawer';
import { Icon } from '#components/icon';
import { IconButton } from '#components/icon-button';
import { PageAction } from '#components/page-action';
import { useMediaQuery } from '#hooks/use-media-query';

export type OutlineDrawerTriggerProps = {
  page: Page;
};

export function OutlineDrawerTrigger(props: OutlineDrawerTriggerProps) {
  const { page } = props;
  const isOutlineInline = useMediaQuery('(min-width: 1324px)');
  const [isOpen, setIsOpen] = useState(false);

  const headings = useMemo(
    () =>
      getHeadings(page, {
        maxLevel: 3,
        minLevel: 2,
      }),
    [
      page,
    ],
  );

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
          <ContentAnchorNavigation
            headings={headings}
            key={page.href}
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
