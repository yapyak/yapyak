import type { DiagnosticBlock } from '@yapyak/doc-compiler';
import type { Language } from '#lib/tokenize';
import type { BoxProps } from '#primitives/box';

import { CheckIcon } from '#components/check-icon';
import { CodeBlockToken } from '#components/code-block-token';
import { XIcon } from '#components/x-icon';
import { tokenize } from '#lib/tokenize';
import { Box } from '#primitives/box';

import styles from './block-renderer-node-diagnostic.module.css';

export type BlockRendererNodeDiagnosticProps = BoxProps<'code'> & {
  block: DiagnosticBlock;
};

const SUPPORTED_LANGUAGES: Set<string> = new Set<Language>([
  'tsx',
  'ts',
  'jsx',
  'js',
  'svelte',
  'vue',
  'astro',
  'bash',
  'json',
  'diff',
  'html',
  'yaml',
  'translation',
]);

function isSupportedLanguage(value: string): value is Language {
  return SUPPORTED_LANGUAGES.has(value);
}

export function BlockRendererNodeDiagnostic(
  props: BlockRendererNodeDiagnosticProps,
) {
  const { block, className, ...restProps } = props;
  const language: Language = isSupportedLanguage(block.language)
    ? block.language
    : 'ts';

  return (
    <Box
      className={[
        styles.Diagnostics,
        className,
      ]}
    >
      {block.lines.map((line, index) => {
        const highlighted = tokenize(line.code, language);
        return (
          <Box
            className={styles.Line}
            data-status={line.status}
            key={index}
          >
            <Box
              aria-label={line.status === 'ok' ? 'valid' : 'error'}
              className={styles.Indicator}
            >
              {line.status === 'ok' ? <CheckIcon /> : <XIcon />}
            </Box>
            <Box className={styles.Body}>
              <Box
                {...restProps}
                as="code"
                className={styles.Code}
              >
                {highlighted.map((token, tokenIndex) => (
                  <CodeBlockToken
                    key={tokenIndex}
                    kind={token.kind}
                  >
                    {token.value}
                  </CodeBlockToken>
                ))}
              </Box>
              {line.message !== null && (
                <Box
                  as="span"
                  className={styles.Message}
                >
                  {line.message}
                </Box>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
