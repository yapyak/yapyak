import type { BoxProps } from '#components/box';
import type { TokenKind } from '#utils/tokenize';

import { Box } from '#components/box';

import styles from './code-block-token.module.css';

export type CodeBlockTokenProps = BoxProps<'span'> & {
  kind: TokenKind;
};

export function CodeBlockToken(props: CodeBlockTokenProps) {
  const { className, kind, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="span"
      className={[
        styles.CodeBlockToken,
        className,
      ]}
      data-kind={kind}
    />
  );
}
