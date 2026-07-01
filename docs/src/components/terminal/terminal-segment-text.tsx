import type { TerminalSegment } from '@yapyak/doc-compiler';

import { Box } from '#primitives/box';

import styles from './terminal.module.css';

const SEGMENT_CLASS_NAMES: Record<TerminalSegment['segmentKind'], string> = {
  'bar-empty': 'BarEmpty',
  'bar-fill': 'BarFill',
  bold: 'Bold',
  cyan: 'Cyan',
  dim: 'Dim',
  green: 'Green',
  red: 'Red',
  text: 'Text',
  yellow: 'Yellow',
};

export type TerminalSegmentTextProps = {
  segment: TerminalSegment;
};

export function TerminalSegmentText(props: TerminalSegmentTextProps) {
  const { segment } = props;

  return (
    <Box
      as="span"
      className={styles[SEGMENT_CLASS_NAMES[segment.segmentKind]]}
    >
      {segment.value}
    </Box>
  );
}
