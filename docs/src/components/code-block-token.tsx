import type { BoxProps } from '#components/box';
import type { TokenType } from '#utils/tokenize';

import { Box } from '#components/box';

import styles from './code-block-token.module.css';

export interface CodeBlockTokenProps extends BoxProps<'span'> {
  type: TokenType;
}

export function CodeBlockToken(props: CodeBlockTokenProps) {
  const { className, type, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="span"
      className={[styles.CodeBlockToken, className]}
      data-type={type}
    />
  );
}
