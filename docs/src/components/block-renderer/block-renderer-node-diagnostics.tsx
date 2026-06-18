import type { DiagnosticsBlock } from '@yapyak/doc-extractor';
import type { Language } from '#utils/tokenize';

import { Box } from '#components/box';
import { CodeBlockToken } from '#components/code-block-token';
import { tokenize } from '#utils/tokenize';

import styles from './block-renderer-node-diagnostics.module.css';

export type BlockRendererNodeDiagnosticsProps = {
  block: DiagnosticsBlock;
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

export function BlockRendererNodeDiagnostics(
  props: BlockRendererNodeDiagnosticsProps,
) {
  const { block } = props;
  const language: Language = isSupportedLanguage(block.language)
    ? block.language
    : 'ts';

  return (
    <Box className={styles.Diagnostics}>
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
              {line.status === 'ok' ? '✓' : '✗'}
            </Box>
            <Box
              as="code"
              className={styles.Code}
            >
              {highlighted.map((token, tokenIndex) => (
                <CodeBlockToken
                  key={tokenIndex}
                  type={token.type}
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
        );
      })}
    </Box>
  );
}
