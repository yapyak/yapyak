import type { BoxProps } from '#primitives/box';
import type { Language } from '#lib/tokenize';

import { Box } from '#primitives/box';
import { CodeBlockToken } from '#components/code-block-token';
import { tokenize } from '#lib/tokenize';

import styles from './code-block.module.css';
import { CodeBlockCopyButton } from './code-block-copy-button';

export type CodeBlockProps = BoxProps & {
  bare?: boolean;
  label?: string;
  language?: string;
  path?: string;
  source: string;
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

function isSupportedLanguage(value: string | undefined): value is Language {
  return value !== undefined && SUPPORTED_LANGUAGES.has(value);
}

export function CodeBlock(props: CodeBlockProps) {
  const { bare, className, label, language, path, source, ...restProps } =
    props;

  const highlighted = isSupportedLanguage(language)
    ? tokenize(source, language)
    : null;

  return (
    <Box
      {...restProps}
      className={[
        styles.CodeBlock,
        className,
      ]}
      data-bare={bare === true ? '' : undefined}
      data-language={language}
    >
      {path !== undefined && (
        <Box className={styles.Header}>
          <Box
            as="span"
            className={styles.PathText}
          >
            {path}
          </Box>
        </Box>
      )}
      {path === undefined && label !== undefined && (
        <Box
          as="span"
          className={styles.LabelText}
        >
          {label}
        </Box>
      )}
      <Box
        as="pre"
        className={styles.PreformattedText}
      >
        <Box as="code">
          {highlighted === null
            ? source
            : highlighted.map((token, index) => (
                <CodeBlockToken
                  key={index}
                  kind={token.kind}
                >
                  {token.value}
                </CodeBlockToken>
              ))}
        </Box>
      </Box>
      <CodeBlockCopyButton
        className={styles.CopyButton}
        source={source}
      />
    </Box>
  );
}
