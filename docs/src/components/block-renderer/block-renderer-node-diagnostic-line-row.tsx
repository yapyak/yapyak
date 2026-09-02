import type { DiagnosticBlock } from '@yapyak/docs-compiler';
import type { Language } from '#lib/tokenize';

import { tokenize } from '#lib/tokenize';
import { Box } from '#primitives/box';

import { CodeBlockToken } from '../code-block-token';
import { Icon } from '../icon';
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
        {line.status === 'ok' ? (
          <Icon
            name="check"
            size="14"
          />
        ) : (
          <Icon
            name="cross"
            size="14"
          />
        )}
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
