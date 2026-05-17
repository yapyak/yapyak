import type { BoxProps } from '#components/box';
import type { Block } from '#lib/content';

import { BlockRenderer } from '#components/block-renderer';
import { Box } from '#components/box';

import styles from './description.module.css';

export interface ReferenceSymbolDescriptionProps extends BoxProps<'section'> {
  blocks: Block[];
}

export function ReferenceSymbolDescription(
  props: ReferenceSymbolDescriptionProps,
) {
  const { blocks, className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="section"
      className={[styles.ReferenceSymbolDescription, className]}
    >
      <BlockRenderer blocks={blocks} />
    </Box>
  );
}
