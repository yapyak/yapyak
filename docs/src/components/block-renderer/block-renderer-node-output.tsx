import type { OutputBlock } from '@yapyak/doc-extractor';

import { Box } from '#components/box';

import styles from './block-renderer-node-output.module.css';

export type BlockRendererNodeOutputProps = {
  block: OutputBlock;
};

export function BlockRendererNodeOutput(props: BlockRendererNodeOutputProps) {
  const { block } = props;
  const hasLocales = block.lines.some((line) => line.locale !== null);

  return (
    <Box
      className={styles.Output}
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
