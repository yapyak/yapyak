import type { BoxProps } from '#primitives/box';

import { MobileDialogTrigger } from '#components/mobile-dialog-trigger';
import { SearchDialogTrigger } from '#components/search-dialog-trigger';
import { Box } from '#primitives/box';

import styles from './mobile-bar.module.css';

export type MobileBarProps = BoxProps & {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function MobileBar(props: MobileBarProps) {
  const { className, onOpenChange, open, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[
        styles.MobileBar,
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
