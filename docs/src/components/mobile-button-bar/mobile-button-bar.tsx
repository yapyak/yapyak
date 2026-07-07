import type { BoxProps } from '#primitives/box';

import { MobileDialogTrigger } from '#components/mobile-dialog-trigger';
import { SearchDialogTrigger } from '#components/search-dialog-trigger';
import { Box } from '#primitives/box';

import styles from './mobile-button-bar.module.css';

export type MobileButtonBarProps = BoxProps & {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function MobileButtonBar(props: MobileButtonBarProps) {
  const { className, onOpenChange, open, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[
        styles.MobileButtonBar,
        className,
      ]}
    >
      <SearchDialogTrigger variant="icon" />
      <Box
        aria-hidden="true"
        as="span"
        className={styles.Divider}
      />
      <MobileDialogTrigger
        onOpenChange={onOpenChange}
        open={open}
      />
    </Box>
  );
}
