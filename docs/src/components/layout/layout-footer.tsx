import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './layout-footer.module.css';

export type LayoutFooterProps = BoxProps<'footer'>;

export function LayoutFooter(props: LayoutFooterProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="footer"
      className={[
        styles.LayoutFooter,
        className,
      ]}
    />
  );
}
