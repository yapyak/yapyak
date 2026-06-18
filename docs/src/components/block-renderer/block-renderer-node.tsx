import type { Block } from '@yapyak/doc-extractor';

import { BlockRendererNodeCallout } from './block-renderer-node-callout';
import { BlockRendererNodeCodeBlock } from './block-renderer-node-code-block';
import { BlockRendererNodeCodeExpression } from './block-renderer-node-code-expression';
import { BlockRendererNodeCodeGroup } from './block-renderer-node-code-group';
import { BlockRendererNodeCodeLocation } from './block-renderer-node-code-location';
import { BlockRendererNodeDivider } from './block-renderer-node-divider';
import { BlockRendererNodeEmphasis } from './block-renderer-node-emphasis';
import { BlockRendererNodeEyebrow } from './block-renderer-node-eyebrow';
import { BlockRendererNodeHeading } from './block-renderer-node-heading';
import { BlockRendererNodeImage } from './block-renderer-node-image';
import { BlockRendererNodeInlineCode } from './block-renderer-node-inline-code';
import { BlockRendererNodeLineBreak } from './block-renderer-node-line-break';
import { BlockRendererNodeLink } from './block-renderer-node-link';
import { BlockRendererNodeList } from './block-renderer-node-list';
import { BlockRendererNodeListItem } from './block-renderer-node-list-item';
import { BlockRendererNodeOnly } from './block-renderer-node-only';
import { BlockRendererNodeOutput } from './block-renderer-node-output';
import { BlockRendererNodeParagraph } from './block-renderer-node-paragraph';
import { BlockRendererNodeQuote } from './block-renderer-node-quote';
import { BlockRendererNodeStrikethrough } from './block-renderer-node-strikethrough';
import { BlockRendererNodeStrong } from './block-renderer-node-strong';
import { BlockRendererNodeSwitch } from './block-renderer-node-switch';
import { BlockRendererNodeTable } from './block-renderer-node-table';
import { BlockRendererNodeTableCell } from './block-renderer-node-table-cell';
import { BlockRendererNodeTableRow } from './block-renderer-node-table-row';
import { BlockRendererNodeText } from './block-renderer-node-text';

export type BlockRendererNodeProps = {
  block: Block;
};

export function BlockRendererNode(props: BlockRendererNodeProps) {
  const { block } = props;
  switch (block.type) {
    case 'text':
      return <BlockRendererNodeText block={block} />;
    case 'heading':
      return <BlockRendererNodeHeading block={block} />;
    case 'paragraph':
      return <BlockRendererNodeParagraph block={block} />;
    case 'link':
      return <BlockRendererNodeLink block={block} />;
    case 'image':
      return <BlockRendererNodeImage block={block} />;
    case 'list':
      return <BlockRendererNodeList block={block} />;
    case 'list-item':
      return <BlockRendererNodeListItem block={block} />;
    case 'emphasis':
      return <BlockRendererNodeEmphasis block={block} />;
    case 'strong':
      return <BlockRendererNodeStrong block={block} />;
    case 'strikethrough':
      return <BlockRendererNodeStrikethrough block={block} />;
    case 'inline-code':
      return <BlockRendererNodeInlineCode block={block} />;
    case 'quote':
      return <BlockRendererNodeQuote block={block} />;
    case 'divider':
      return <BlockRendererNodeDivider />;
    case 'line-break':
      return <BlockRendererNodeLineBreak />;
    case 'table':
      return <BlockRendererNodeTable block={block} />;
    case 'table-row':
      return <BlockRendererNodeTableRow block={block} />;
    case 'table-cell':
      return <BlockRendererNodeTableCell block={block} />;
    case 'code-block':
      return <BlockRendererNodeCodeBlock block={block} />;
    case 'code-expression':
      return <BlockRendererNodeCodeExpression block={block} />;
    case 'code-group':
      return <BlockRendererNodeCodeGroup block={block} />;
    case 'switch':
      return <BlockRendererNodeSwitch block={block} />;
    case 'only':
      return <BlockRendererNodeOnly block={block} />;
    case 'output':
      return <BlockRendererNodeOutput block={block} />;
    case 'callout':
      return <BlockRendererNodeCallout block={block} />;
    case 'eyebrow':
      return <BlockRendererNodeEyebrow block={block} />;
    case 'code-location':
      return <BlockRendererNodeCodeLocation block={block} />;
    default:
      return null;
  }
}
