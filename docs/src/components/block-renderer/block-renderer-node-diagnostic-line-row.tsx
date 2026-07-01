import type { DiagnosticBlock } from '@yapyak/doc-compiler';
import type { Language } from '#lib/tokenize';

import { CheckIcon } from '#components/check-icon';
import { CodeBlockToken } from '#components/code-block-token';
import { XIcon } from '#components/x-icon';
import { tokenize } from '#lib/tokenize';
import { Box } from '#primitives/box';

import styles from './block-renderer-node-diagnostic.module.css';

export type BlockRendererNodeDiagnosticLineRowProps = {
  language: Language;
  line: DiagnosticBlock['lines'][number];
};

export function BlockRendererNodeDiagnosticLineRow(
  props: BlockRendererNodeDiagnosticLineRowProps,
) {
  const { language, line } = props;
  const tokens = tokenize(line.code, language);

  return (
    <Box
      className={styles.LineRow}
      data-status={line.status}
    >
      <Box
        aria-label={line.status === 'ok' ? 'valid' : 'error'}
        className={styles.StatusIcon}
      >
        {line.status === 'ok' ? <CheckIcon /> : <XIcon />}
      </Box>
      <Box className={styles.BodyStack}>
        <Box
          as="code"
          className={styles.Code}
        >
          {tokens.map((token, index) => (
            <CodeBlockToken
              key={index}
              kind={token.kind}
            >
              {token.value}
            </CodeBlockToken>
          ))}
        </Box>
        {line.message && (
          <Box
            as="span"
            className={styles.MessageText}
          >
            {line.message}
          </Box>
        )}
      </Box>
    </Box>
  );
}
