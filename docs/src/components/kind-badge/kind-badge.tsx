import type { ExportKind } from '@yapyak/doc-compiler';
import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './kind-badge.module.css';

export type KindBadgeSize = 'lg' | 'md' | 'sm';

export type KindBadgeProps = BoxProps<'span'> & {
  size?: KindBadgeSize;
  variant: ExportKind;
};

export function KindBadge(props: KindBadgeProps) {
  const { className, size = 'md', variant, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="span"
      className={[
        styles.KindBadge,
        className,
      ]}
      data-size={size}
      data-variant={variant}
    >
      {variant}
    </Box>
  );
}
