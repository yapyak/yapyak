import type { Block } from '#lib/content';

import { BlockRendererNodeBlockquote } from './node/blockquote';
import { BlockRendererNodeCallout } from './node/callout';
import { BlockRendererNodeCodeBlock } from './node/code-block';
import { BlockRendererNodeCodeGroup } from './node/code-group';
import { BlockRendererNodeEmphasis } from './node/emphasis';
import { BlockRendererNodeHeading } from './node/heading';
import { BlockRendererNodeImage } from './node/image';
import { BlockRendererNodeInlineCode } from './node/inline-code';
import { BlockRendererNodeLineBreak } from './node/line-break';
import { BlockRendererNodeLink } from './node/link';
import { BlockRendererNodeList } from './node/list';
import { BlockRendererNodeListItem } from './node/list-item';
import { BlockRendererNodeParagraph } from './node/paragraph';
import { BlockRendererNodeStrikethrough } from './node/strikethrough';
import { BlockRendererNodeStrong } from './node/strong';
import { BlockRendererNodeTable } from './node/table';
import { BlockRendererNodeTableCell } from './node/table-cell';
import { BlockRendererNodeTableHeaderCell } from './node/table-header-cell';
import { BlockRendererNodeTableRow } from './node/table-row';
import { BlockRendererNodeText } from './node/text';
import { BlockRendererNodeThematicBreak } from './node/thematic-break';

export interface BlockRendererNodeProps {
  block: Block;
}

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
    case 'blockquote':
      return <BlockRendererNodeBlockquote block={block} />;
    case 'thematic-break':
      return <BlockRendererNodeThematicBreak />;
    case 'line-break':
      return <BlockRendererNodeLineBreak />;
    case 'table':
      return <BlockRendererNodeTable block={block} />;
    case 'table-row':
      return <BlockRendererNodeTableRow block={block} />;
    case 'table-header-cell':
      return <BlockRendererNodeTableHeaderCell block={block} />;
    case 'table-cell':
      return <BlockRendererNodeTableCell block={block} />;
    case 'code-block':
      return <BlockRendererNodeCodeBlock block={block} />;
    case 'code-group':
      return <BlockRendererNodeCodeGroup block={block} />;
    case 'callout':
      return <BlockRendererNodeCallout block={block} />;
  }
}
