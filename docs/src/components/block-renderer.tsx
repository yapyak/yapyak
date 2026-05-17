import type { BoxProps } from '#components/box';
import type { CalloutVariant } from '#components/callout';
import type { CodeGroupBlock } from '#components/code-group';
import type { Block } from '#lib/content';

import { Fragment } from 'react';

import { Box } from '#components/box';
import { Callout } from '#components/callout';
import { CodeBlock } from '#components/code-block';
import { CodeGroup } from '#components/code-group';

import styles from './block-renderer.module.css';

export interface BlockRendererProps extends BoxProps {
  blocks: Block[];
}

export function BlockRenderer(props: BlockRendererProps) {
  const { blocks, className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[styles.BlockRenderer, className]}
    >
      {blocks.map(renderBlock)}
    </Box>
  );
}

function renderBlock(block: Block, index: number) {
  return <Fragment key={index}>{renderBlockContent(block)}</Fragment>;
}

function renderBlockContent(block: Block) {
  if (block.type === 'text') {
    return block.value;
  }

  const children = block.children.map(renderBlock);

  switch (block.type) {
    case 'Callout':
      return (
        <Callout
          title={block.attributes.title as string | undefined}
          variant={block.attributes.variant as CalloutVariant}
        >
          {children}
        </Callout>
      );
    case 'CodeBlock':
      return (
        <CodeBlock
          language={block.attributes.language as string | undefined}
          source={block.attributes.source as string}
        />
      );
    case 'CodeGroup':
      return <CodeGroup blocks={extractCodeBlocks(block)} />;
    case 'a':
      return (
        <Box
          as="a"
          href={block.attributes.href as string}
        >
          {children}
        </Box>
      );
    case 'img':
      return (
        <Box
          alt={block.attributes.alt as string | undefined}
          as="img"
          src={block.attributes.src as string}
        />
      );
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return (
        <Box
          as={block.type}
          id={block.attributes.id as string | undefined}
        >
          {children}
        </Box>
      );
    case 'hr':
    case 'br':
      return <Box as={block.type} />;
    case 'p':
    case 'ul':
    case 'ol':
    case 'li':
    case 'strong':
    case 'em':
    case 's':
    case 'code':
    case 'blockquote':
    case 'table':
    case 'thead':
    case 'tbody':
    case 'tr':
    case 'th':
    case 'td':
      return <Box as={block.type}>{children}</Box>;
    default:
      throw new Error(`BlockRenderer: unknown block type "${block.type}"`);
  }
}

function extractCodeBlocks(group: Block) {
  const blocks: CodeGroupBlock[] = [];
  for (const child of group.children) {
    if (child.type !== 'CodeBlock') {
      continue;
    }
    const language = child.attributes.language;
    const source = child.attributes.source;
    const label = child.attributes.label;
    blocks.push({
      label:
        typeof label === 'string'
          ? label
          : typeof language === 'string'
            ? language
            : 'Code',
      language: typeof language === 'string' ? language : undefined,
      source: typeof source === 'string' ? source : '',
    });
  }
  return blocks;
}
