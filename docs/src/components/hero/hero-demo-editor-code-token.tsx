import type { Token } from '#lib/tokenize';

import { CodeBlockToken } from '#components/code-block-token';
import { Box } from '#primitives/box';

import styles from './hero-demo-editor.module.css';

const CARET_MARKER = 'CARET';

export type HeroDemoEditorCodeTokenProps = {
  token: Token;
  typing: boolean;
};

export function HeroDemoEditorCodeToken(props: HeroDemoEditorCodeTokenProps) {
  const { token, typing } = props;

  if (token.kind !== 'tx-source' || !token.value.includes(CARET_MARKER)) {
    return <CodeBlockToken kind={token.kind}>{token.value}</CodeBlockToken>;
  }

  const inner = token.value.slice(1, -1);
  const parts = inner.split(CARET_MARKER);
  const before = parts[0] ?? '';
  const after = parts[1] ?? '';

  return (
    <CodeBlockToken kind="tx-source">
      <Box as="span">'</Box>
      {before}
      <Box
        aria-hidden="true"
        as="span"
        className={styles.Caret}
        data-typing={typing}
      />
      {after}
      <Box as="span">'</Box>
    </CodeBlockToken>
  );
}
