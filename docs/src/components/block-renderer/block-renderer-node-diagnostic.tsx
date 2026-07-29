import type { DiagnosticBlock } from '@yapyak/docs-compiler';
import type { Language } from '#lib/tokenize';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './block-renderer-node-diagnostic.module.css';
import { BlockRendererNodeDiagnosticLineRow } from './block-renderer-node-diagnostic-line-row';

export type BlockRendererNodeDiagnosticProps = BoxProps & {
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
      {...restProps}
      className={[
        styles.BlockRendererNodeDiagnostic,
        className,
      ]}
    >
      {block.lines.map((line, index) => (
        <BlockRendererNodeDiagnosticLineRow
          key={index}
          language={language}
          line={line}
        />
      ))}
    </Box>
  );
}
