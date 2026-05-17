import type { BoxProps } from '#components/box';

import { useId } from 'react';

import { Box } from '#components/box';
import { CodeBlock } from '#components/code-block';

import styles from './code-group.module.css';

export interface CodeGroupBlock {
  label: string;
  language?: string;
  source: string;
}

export interface CodeGroupProps extends BoxProps {
  blocks: CodeGroupBlock[];
}

export function CodeGroup(props: CodeGroupProps) {
  const { blocks, className, ...restProps } = props;
  const groupId = useId();

  return (
    <Box
      {...restProps}
      className={[styles.CodeGroup, className]}
    >
      <Box className={styles.TabRow}>
        {blocks.map((block, index) => (
          <Box
            as="label"
            className={styles.TabLabel}
            key={index}
          >
            <Box
              aria-label={block.label}
              as="input"
              className={styles.TabInput}
              defaultChecked={index === 0}
              name={groupId}
              type="radio"
            />
            <Box
              as="span"
              className={styles.TabText}
            >
              {block.label}
            </Box>
            <Box
              aria-hidden="true"
              className={styles.IndicatorBar}
            />
          </Box>
        ))}
      </Box>
      <Box className={styles.CodeBlockStack}>
        {blocks.map((block, index) => (
          <Box
            className={styles.CodeBlockWrapper}
            key={index}
          >
            <CodeBlock
              language={block.language}
              source={block.source}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
