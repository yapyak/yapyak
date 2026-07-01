import type { BoxProps } from '#primitives/box';
import type { TokenKind } from '#lib/tokenize';

import { Box } from '#primitives/box';

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
