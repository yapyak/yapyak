import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './preformatted-text.module.css';

export type PreformattedTextProps = BoxProps<'pre'>;

export function PreformattedText(props: PreformattedTextProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="pre"
      className={[
        styles.PreformattedText,
        className,
      ]}
    />
  );
}
