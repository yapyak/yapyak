import type { BoxProps } from '#components/box';
import type { ExportKind } from '#lib/content';

import { Box } from '#components/box';

import styles from './kind-badge.module.css';

export interface KindBadgeProps extends BoxProps<'span'> {
  variant: ExportKind;
}

export function KindBadge(props: KindBadgeProps) {
  const { className, variant, ...restProps } = props;
  return (
    <Box
      {...restProps}
      as="span"
      className={[styles.KindBadge, className]}
      data-variant={variant}
    >
      {variant}
    </Box>
  );
}
