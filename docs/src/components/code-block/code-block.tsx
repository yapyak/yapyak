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

const SUPPORTED_LANGUAGES: ReadonlySet<string> = new Set<Language>([
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

const HIDDEN_LABEL_LANGUAGES: ReadonlySet<string> = new Set<Language>([
  'translation',
]);

function isSupportedLanguage(value: string | undefined): value is Language {
  return value !== undefined && SUPPORTED_LANGUAGES.has(value);
}

export function CodeBlock(props: CodeBlockProps) {
  const { className, label, language, source, ...restProps } = props;

  const showLabel =
    label !== undefined ||
    (language !== undefined && !HIDDEN_LABEL_LANGUAGES.has(language));
  const tag = label ?? language;
  const highlighted = isSupportedLanguage(language)
    ? tokenize(source, language)
    : null;

  return (
    <Box
      {...restProps}
      className={[styles.CodeBlock, className]}
      data-language={language}
    >
      {showLabel && tag !== undefined && (
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
          {highlighted === null
            ? source
            : highlighted.map((token, index) => (
                <CodeBlockToken
                  key={index}
                  type={token.type}
                >
                  {token.value}
                </CodeBlockToken>
              ))}
        </Box>
      </Box>
    </Box>
  );
}
