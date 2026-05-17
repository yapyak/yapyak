import type { BoxProps } from '#components/box';

import { useId } from 'react';

import { Box } from '#components/box';
import { CodeBlock } from '#components/code-block';

import styles from './code-group.module.css';

export interface CodeGroupTab {
  label: string | null;
  language: string | null;
  source: string;
}

export interface CodeGroupProps extends BoxProps {
  tabs: CodeGroupTab[];
}

export function CodeGroup(props: CodeGroupProps) {
  const { className, tabs, ...restProps } = props;
  const groupId = useId();

  return (
    <Box
      {...restProps}
      className={[styles.CodeGroup, className]}
    >
      <Box className={styles.TabRow}>
        {tabs.map((tab, index) => (
          <Box
            as="label"
            className={styles.TabLabel}
            key={index}
          >
            <Box
              aria-label={tab.label ?? tab.language ?? 'Code'}
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
              {tab.label ?? tab.language ?? 'Code'}
            </Box>
            <Box
              aria-hidden="true"
              className={styles.IndicatorBar}
            />
          </Box>
        ))}
      </Box>
      <Box className={styles.CodeBlockStack}>
        {tabs.map((tab, index) => (
          <Box
            className={styles.CodeBlockWrapper}
            key={index}
          >
            <CodeBlock
              language={tab.language}
              source={tab.source}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
