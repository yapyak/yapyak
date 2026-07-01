import type { TerminalLine } from '@yapyak/doc-compiler';

import { Box } from '#primitives/box';

import styles from './terminal.module.css';
import { TerminalSegmentText } from './terminal-segment-text';

export type TerminalLineRowProps = {
  line: TerminalLine;
};

export function TerminalLineRow(props: TerminalLineRowProps) {
  const { line } = props;

  return (
    <Box
      as="span"
      className={styles.Line}
    >
      {line.segments.map((segment, index) => (
        <TerminalSegmentText
          key={index}
          segment={segment}
        />
      ))}
    </Box>
  );
}
