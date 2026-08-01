import type { OutputBlock } from '@yapyak/docs-compiler';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './block-renderer-node-output.module.css';

export type BlockRendererNodeOutputProps = BoxProps & {
  block: OutputBlock;
};

export function BlockRendererNodeOutput(props: BlockRendererNodeOutputProps) {
  const { block, className, ...restProps } = props;
  const hasLocales = block.lines.some((line) => line.locale !== null);

  return (
    <Box
      {...restProps}
      className={[
        styles.BlockRendererNodeOutput,
        className,
      ]}
      data-with-locales={hasLocales}
    >
      {block.lines.map((line, index) => (
        <Box
          className={styles.Line}
          key={index}
        >
          {line.locale !== null && (
            <Box
              as="span"
              className={styles.Locale}
            >
              {line.locale}
            </Box>
          )}
          <Box
            as="span"
            className={styles.Value}
          >
            {line.value}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
