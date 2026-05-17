import type { BoxProps } from '#components/box';
import type { CalloutVariant } from '#components/callout';
import type { CodeGroupBlock } from '#components/code-group';
import type { MarkdocNode, MarkdocTag } from '#lib/markdoc';

import { Fragment } from 'react';

import { Box } from '#components/box';
import { Callout } from '#components/callout';
import { CodeBlock } from '#components/code-block';
import { CodeGroup } from '#components/code-group';

import styles from './markdoc-renderer.module.css';

export interface MarkdocRendererProps extends BoxProps {
  tree: MarkdocNode[];
}

export function MarkdocRenderer(props: MarkdocRendererProps) {
  const { className, tree, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[styles.MarkdocRenderer, className]}
    >
      {tree.map((node, index) => (
        <Fragment key={index}>{renderNode(node)}</Fragment>
      ))}
    </Box>
  );
}

function renderNode(node: MarkdocNode) {
  if (node === null) {
    return null;
  }
  if (typeof node === 'string') {
    return node;
  }
  if (typeof node === 'number' || typeof node === 'boolean') {
    return String(node);
  }
  return renderTag(node);
}

function renderTag(tag: MarkdocTag) {
  const children = tag.children.map((child, index) => (
    <Fragment key={index}>{renderNode(child)}</Fragment>
  ));

  switch (tag.name) {
    case 'Callout':
      return (
        <Callout
          title={tag.attributes.title as string | undefined}
          variant={tag.attributes.variant as CalloutVariant}
        >
          {children}
        </Callout>
      );
    case 'CodeBlock':
      return (
        <CodeBlock
          language={tag.attributes.language as string | undefined}
          source={tag.attributes.source as string}
        />
      );
    case 'CodeGroup':
      return <CodeGroup blocks={extractCodeBlocks(tag)} />;
    case 'a':
      return (
        <Box
          as="a"
          href={tag.attributes.href as string}
        >
          {children}
        </Box>
      );
    case 'img':
      return (
        <Box
          alt={tag.attributes.alt as string | undefined}
          as="img"
          src={tag.attributes.src as string}
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
          as={tag.name}
          id={tag.attributes.id as string | undefined}
        >
          {children}
        </Box>
      );
    case 'hr':
    case 'br':
      return <Box as={tag.name} />;
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
      return <Box as={tag.name}>{children}</Box>;
    default:
      throw new Error(`MarkdocRenderer: unknown tag "${tag.name}"`);
  }
}

function extractCodeBlocks(group: MarkdocTag) {
  const blocks: CodeGroupBlock[] = [];
  for (const child of group.children) {
    if (
      typeof child !== 'object' ||
      child === null ||
      child.$$mdtype !== 'Tag' ||
      child.name !== 'CodeBlock'
    ) {
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
