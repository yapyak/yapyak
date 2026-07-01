import type { ExportKind } from '@yapyak/doc-compiler';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './kind-badge.module.css';

export type KindBadgeAppearance = 'plain' | 'solid';
export type KindBadgeSize = 'lg' | 'md' | 'sm';

export type KindBadgeProps = BoxProps<'span'> & {
  appearance?: KindBadgeAppearance;
  size?: KindBadgeSize;
  variant: ExportKind;
};

export function KindBadge(props: KindBadgeProps) {
  const {
    appearance = 'solid',
    className,
    size = 'md',
    variant,
    ...restProps
  } = props;

  return (
    <Box
      {...restProps}
      as="span"
      className={[
        styles.KindBadge,
        className,
      ]}
      data-appearance={appearance}
      data-size={size}
      data-variant={variant}
    >
      {variant}
    </Box>
  );
}
