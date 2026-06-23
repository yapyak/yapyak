import type { Page } from '@yapyak/doc-compiler';

import { useId, useMemo } from 'react';
import { t } from 'yapyak';

import { Box } from '#components/box';
import { ChevronIcon } from '#components/chevron-icon';
import { Popover } from '#components/popover';

import styles from './page-outline.module.css';
import { doc } from 'virtual:doc-compiler';

export type PageOutlineProps = {
  page: Page;
};

export function PageOutline(props: PageOutlineProps) {
  const { page } = props;
  const popoverId = useId();
  const anchorName = `--anchor${popoverId.replace(/[^a-z0-9-]/gi, '-')}`;
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

  if (headings.length === 0) {
    return null;
  }

  return (
    <>
      <Box
        as="button"
        className={styles.Trigger}
        popoverTarget={popoverId}
        style={{
          '--trigger-anchor': anchorName,
        }}
        type="button"
      >
        <Box
          as="span"
          className={styles.TriggerLabel}
        >
          {t('On this page')}
        </Box>
        <ChevronIcon direction="down" />
      </Box>
      <Popover
        align="end"
        anchorName={anchorName}
        id={popoverId}
      >
        <Box className={styles.List}>
          {headings.map((heading) => (
            <Box
              as="a"
              className={styles.Item}
              data-level={heading.level}
              href={`#${heading.id}`}
              key={heading.id}
              onClick={(event) => {
                event.preventDefault();
                const targetElement = document.getElementById(heading.id);
                if (!targetElement) {
                  return;
                }
                targetElement.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                });
                history.replaceState(null, '', `#${heading.id}`);
                document.getElementById(popoverId)?.hidePopover();
              }}
            >
              {heading.text}
            </Box>
          ))}
        </Box>
      </Popover>
    </>
  );
}
