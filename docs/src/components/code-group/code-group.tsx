import type { BoxProps } from '#components/box';

import { useId, useState } from 'react';

import { Box } from '#components/box';
import { CodeBlock, CodeBlockCopyButton } from '#components/code-block';

import styles from './code-group.module.css';

export type CodeGroupTab = {
  label?: string;
  language?: string;
  source: string;
};

export interface CodeGroupProps extends BoxProps {
  tabs: CodeGroupTab[];
}

export function CodeGroup(props: CodeGroupProps) {
  const { className, tabs, ...restProps } = props;

  const groupId = useId();
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSource = tabs[activeIndex]?.source ?? '';

  return (
    <Box
      {...restProps}
      className={[
        styles.CodeGroup,
        className,
      ]}
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
              onChange={() => setActiveIndex(index)}
              type="radio"
            />
            <Box as="span">{tab.label ?? tab.language ?? 'Code'}</Box>
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
              bare={true}
              language={tab.language}
              source={tab.source}
            />
          </Box>
        ))}
      </Box>
      <CodeBlockCopyButton
        className={styles.CopyButton}
        source={activeSource}
      />
    </Box>
  );
}
