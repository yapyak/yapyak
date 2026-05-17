import type { BoxProps } from '#components/box';
import type { MarkdocNode } from '#lib/markdoc';

import { Box } from '#components/box';
import { MarkdocRenderer } from '#components/markdoc-renderer';

import styles from './example-section.module.css';

export interface ReferenceSymbolExampleSectionProps
  extends BoxProps<'section'> {
  trees: MarkdocNode[][];
}

export function ReferenceSymbolExampleSection(
  props: ReferenceSymbolExampleSectionProps,
) {
  const { className, trees, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="section"
      className={[styles.ReferenceSymbolExampleSection, className]}
    >
      <Box
        as="h2"
        className={styles.Heading}
      >
        Examples
      </Box>
      <Box className={styles.ExampleStack}>
        {trees.map((tree, index) => (
          <MarkdocRenderer
            key={index}
            tree={tree}
          />
        ))}
      </Box>
    </Box>
  );
}
