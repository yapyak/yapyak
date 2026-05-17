import type { BoxProps } from '#components/box';
import type { Language } from '#utils/tokenize';

import { Box } from '#components/box';
import { CodeBlockToken } from '#components/code-block-token';
import { tokenize } from '#utils/tokenize';

import styles from './code-block.module.css';

export interface CodeBlockProps extends BoxProps {
  label?: string;
  language?: string;
  source: string;
}

const SUPPORTED_LANGUAGES = new Set<Language>([
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
]);

export function CodeBlock(props: CodeBlockProps) {
  const { className, label, language, source, ...restProps } = props;

  const isHighlighted =
    language && SUPPORTED_LANGUAGES.has(language as Language);
  const tag = label ?? language;

  return (
    <Box
      {...restProps}
      className={[styles.CodeBlock, className]}
      data-language={language}
    >
      {tag && (
        <Box
          as="span"
          className={styles.LanguageText}
        >
          {tag}
        </Box>
      )}
      <Box
        as="pre"
        className={styles.PreformattedText}
      >
        <Box as="code">
          {isHighlighted
            ? tokenize(source, language as Language).map((token, index) => (
                <CodeBlockToken
                  key={index}
                  type={token.type}
                >
                  {token.value}
                </CodeBlockToken>
              ))
            : source}
        </Box>
      </Box>
    </Box>
  );
}
