import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './mobile-dialog-footer.module.css';

export type MobileDialogFooterProps = BoxProps<'footer'>;

export function MobileDialogFooter(props: MobileDialogFooterProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="footer"
      className={[
        styles.MobileDialogFooter,
        className,
      ]}
    />
  );
}
