import type { Block } from '#lib/content';

import { NodeBlockquote } from './node/blockquote';
import { NodeCallout } from './node/callout';
import { NodeCodeBlock } from './node/code-block';
import { NodeCodeGroup } from './node/code-group';
import { NodeEmphasis } from './node/emphasis';
import { NodeEyebrow } from './node/eyebrow';
import { NodeHeading } from './node/heading';
import { NodeImage } from './node/image';
import { NodeInlineCode } from './node/inline-code';
import { NodeLineBreak } from './node/line-break';
import { NodeLink } from './node/link';
import { NodeList } from './node/list';
import { NodeListItem } from './node/list-item';
import { NodeParagraph } from './node/paragraph';
import { NodeSourceLink } from './node/source-link';
import { NodeStrikethrough } from './node/strikethrough';
import { NodeStrong } from './node/strong';
import { NodeTable } from './node/table';
import { NodeTableCell } from './node/table-cell';
import { NodeTableHeaderCell } from './node/table-header-cell';
import { NodeTableRow } from './node/table-row';
import { NodeText } from './node/text';
import { NodeThematicBreak } from './node/thematic-break';

export interface BlockRendererNodeProps {
  block: Block;
}

export function BlockRendererNode(props: BlockRendererNodeProps) {
  const { block } = props;
  switch (block.type) {
    case 'text':
      return <NodeText block={block} />;
    case 'heading':
      return <NodeHeading block={block} />;
    case 'paragraph':
      return <NodeParagraph block={block} />;
    case 'link':
      return <NodeLink block={block} />;
    case 'image':
      return <NodeImage block={block} />;
    case 'list':
      return <NodeList block={block} />;
    case 'list-item':
      return <NodeListItem block={block} />;
    case 'emphasis':
      return <NodeEmphasis block={block} />;
    case 'strong':
      return <NodeStrong block={block} />;
    case 'strikethrough':
      return <NodeStrikethrough block={block} />;
    case 'inline-code':
      return <NodeInlineCode block={block} />;
    case 'blockquote':
      return <NodeBlockquote block={block} />;
    case 'thematic-break':
      return <NodeThematicBreak />;
    case 'line-break':
      return <NodeLineBreak />;
    case 'table':
      return <NodeTable block={block} />;
    case 'table-row':
      return <NodeTableRow block={block} />;
    case 'table-header-cell':
      return <NodeTableHeaderCell block={block} />;
    case 'table-cell':
      return <NodeTableCell block={block} />;
    case 'code-block':
      return <NodeCodeBlock block={block} />;
    case 'code-group':
      return <NodeCodeGroup block={block} />;
    case 'callout':
      return <NodeCallout block={block} />;
    case 'eyebrow':
      return <NodeEyebrow block={block} />;
    case 'source-link':
      return <NodeSourceLink block={block} />;
  }
}
