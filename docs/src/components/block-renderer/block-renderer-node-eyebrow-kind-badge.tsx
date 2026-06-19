import type { ExportKind } from '@yapyak/doc-compiler';
import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './block-renderer-node-eyebrow-kind-badge.module.css';

export type BlockRendererNodeEyebrowKindBadgeProps = BoxProps<'span'> & {
  variant: ExportKind;
};

export function BlockRendererNodeEyebrowKindBadge(
  props: BlockRendererNodeEyebrowKindBadgeProps,
) {
  const { className, variant, ...restProps } = props;
  return (
    <Box
      {...restProps}
      as="span"
      className={[
        styles.BlockRendererNodeEyebrowKindBadge,
        className,
      ]}
      data-variant={variant}
    >
      {variant}
    </Box>
  );
}
