import type { BoxProps } from '#components/box';
import type { Block } from '#lib/content';

import { BlockRenderer } from '#components/block-renderer';
import { Box } from '#components/box';

import styles from './example-section.module.css';

export interface ReferenceSymbolExampleSectionProps
  extends BoxProps<'section'> {
  examples: Block[][];
}

export function ReferenceSymbolExampleSection(
  props: ReferenceSymbolExampleSectionProps,
) {
  const { className, examples, ...restProps } = props;

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
        {examples.map((blocks, index) => (
          <BlockRenderer
            key={index}
            blocks={blocks}
          />
        ))}
      </Box>
    </Box>
  );
}
