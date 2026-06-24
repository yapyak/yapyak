import type { Page } from '@yapyak/doc-compiler';
import type { BoxProps } from '#components/box';

import { useMemo } from 'react';
import { t } from 'yapyak';

import { Box } from '#components/box';
import { OutlineIcon } from '#components/outline-icon';
import { SidebarIcon } from '#components/sidebar-icon';

import { useContentLayout } from './content-layout';
import styles from './content-layout-content-header.module.css';
import { doc } from 'virtual:doc-compiler';

export type ContentLayoutContentHeaderProps = BoxProps<'header'> & {
  page: Page;
};

export function ContentLayoutContentHeader(
  props: ContentLayoutContentHeaderProps,
) {
  const { className, page, ...restProps } = props;

  const { openOutline, openSidebar } = useContentLayout();
  const headings = useMemo(
    () =>
      doc.getHeadings(page, {
        maxLevel: 3,
        minLevel: 2,
      }),
    [
      page,
    ],
  );

  return (
    <Box
      {...restProps}
      as="header"
      className={[
        styles.ContentLayoutContentHeader,
        className,
      ]}
    >
      <Box
        aria-label={t('Open menu')}
        as="button"
        className={styles.SidebarButton}
        onClick={openSidebar}
        type="button"
      >
        <SidebarIcon className={styles.Icon} />
        <Box
          as="span"
          className={styles.Text}
        >
          {t('Menu')}
        </Box>
      </Box>
      {headings.length > 0 && (
        <Box
          aria-label={t('Open page outline')}
          as="button"
          className={styles.OutlineButton}
          onClick={openOutline}
          type="button"
        >
          <Box
            as="span"
            className={styles.Text}
          >
            {t('Page')}
          </Box>
          <OutlineIcon className={styles.Icon} />
        </Box>
      )}
    </Box>
  );
}
