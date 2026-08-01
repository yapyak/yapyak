import type { TerminalLine } from '@yapyak/docs-compiler';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import { PreformattedText } from '../preformatted-text';
import styles from './terminal.module.css';
import { TerminalLineRow } from './terminal-line-row';

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
      <PreformattedText className={styles.PreformattedText}>
        {lines.map((line, index) => (
          <TerminalLineRow
            key={index}
            line={line}
          />
        ))}
      </PreformattedText>
    </Box>
  );
}
