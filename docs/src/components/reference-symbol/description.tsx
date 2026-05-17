import type { BoxProps } from '#components/box';
import type { MarkdocNode } from '#lib/markdoc';

import { Box } from '#components/box';
import { MarkdocRenderer } from '#components/markdoc-renderer';

import styles from './description.module.css';

export interface ReferenceSymbolDescriptionProps extends BoxProps<'section'> {
  tree: MarkdocNode[];
}

export function ReferenceSymbolDescription(
  props: ReferenceSymbolDescriptionProps,
) {
  const { className, tree, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="section"
      className={[styles.ReferenceSymbolDescription, className]}
    >
      <MarkdocRenderer tree={tree} />
    </Box>
  );
}
