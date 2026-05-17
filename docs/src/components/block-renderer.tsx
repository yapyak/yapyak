import type { BoxProps } from '#components/box';
import type {
  Block,
  CodeBlock as CodeBlockData,
  CodeGroupBlock as CodeGroupBlockData,
  HeadingBlock,
  TableBlock,
} from '#lib/content';

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
  switch (block.type) {
    case 'text':
      return block.value;
    case 'heading':
      return (
        <Box
          as={headingTag(block.level)}
          id={block.id}
        >
          {block.children.map(renderBlock)}
        </Box>
      );
    case 'paragraph':
      return <Box as="p">{block.children.map(renderBlock)}</Box>;
    case 'link':
      return (
        <Box
          as="a"
          href={block.href}
        >
          {block.children.map(renderBlock)}
        </Box>
      );
    case 'image':
      return (
        <Box
          alt={block.alt ?? ''}
          as="img"
          src={block.src}
        />
      );
    case 'list':
      return (
        <Box as={block.ordered ? 'ol' : 'ul'}>
          {block.children.map(renderBlock)}
        </Box>
      );
    case 'list-item':
      return <Box as="li">{block.children.map(renderBlock)}</Box>;
    case 'emphasis':
      return <Box as="em">{block.children.map(renderBlock)}</Box>;
    case 'strong':
      return <Box as="strong">{block.children.map(renderBlock)}</Box>;
    case 'strikethrough':
      return <Box as="s">{block.children.map(renderBlock)}</Box>;
    case 'inline-code':
      return <Box as="code">{block.value}</Box>;
    case 'blockquote':
      return <Box as="blockquote">{block.children.map(renderBlock)}</Box>;
    case 'thematic-break':
      return <Box as="hr" />;
    case 'line-break':
      return <Box as="br" />;
    case 'table':
      return renderTable(block);
    case 'table-row':
      return <Box as="tr">{block.children.map(renderBlock)}</Box>;
    case 'table-header-cell':
      return <Box as="th">{block.children.map(renderBlock)}</Box>;
    case 'table-cell':
      return <Box as="td">{block.children.map(renderBlock)}</Box>;
    case 'code-block':
      return renderCodeBlock(block);
    case 'code-group':
      return renderCodeGroup(block);
    case 'callout':
      return (
        <Callout
          title={block.title ?? undefined}
          variant={block.variant}
        >
          {block.children.map(renderBlock)}
        </Callout>
      );
  }
}

function renderTable(block: TableBlock) {
  return (
    <Box as="table">
      {block.head && (
        <Box as="thead">{renderBlock(block.head, 0)}</Box>
      )}
      <Box as="tbody">{block.body.map(renderBlock)}</Box>
    </Box>
  );
}

function renderCodeBlock(block: CodeBlockData) {
  return (
    <CodeBlock
      language={block.language ?? undefined}
      source={block.source}
    />
  );
}

function renderCodeGroup(block: CodeGroupBlockData) {
  return (
    <CodeGroup
      blocks={block.tabs.map((tab) => ({
        label: tab.label ?? tab.language ?? 'Code',
        language: tab.language ?? undefined,
        source: tab.source,
      }))}
    />
  );
}

function headingTag(level: HeadingBlock['level']) {
  switch (level) {
    case 1:
      return 'h1';
    case 2:
      return 'h2';
    case 3:
      return 'h3';
    case 4:
      return 'h4';
    case 5:
      return 'h5';
    case 6:
      return 'h6';
  }
}
