import type { TerminalLine, TerminalSegment } from '@yapyak/doc-compiler';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './terminal.module.css';

export type TerminalProps = BoxProps<'div'> & {
  lines: TerminalLine[];
};

export function Terminal(props: TerminalProps) {
  const { className, lines, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[
        styles.Terminal,
        className,
      ]}
    >
      <Box
        as="pre"
        className={styles.Body}
      >
        {lines.map((line, lineIndex) => (
          <Box
            as="span"
            className={styles.Line}
            key={lineIndex}
          >
            {line.segments.map((segment, segmentIndex) => (
              <Box
                as="span"
                className={styles[getSegmentClassName(segment.segmentKind)]}
                key={segmentIndex}
              >
                {segment.value}
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

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

function getSegmentClassName(kind: TerminalSegment['segmentKind']): string {
  return SEGMENT_CLASS_NAMES[kind];
}
