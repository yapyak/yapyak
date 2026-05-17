import type { Block } from '#lib/content';

import { ItemBlockquote } from './item-blockquote';
import { ItemCallout } from './item-callout';
import { ItemCodeBlock } from './item-code-block';
import { ItemCodeGroup } from './item-code-group';
import { ItemEmphasis } from './item-emphasis';
import { ItemHeading } from './item-heading';
import { ItemImage } from './item-image';
import { ItemInlineCode } from './item-inline-code';
import { ItemLineBreak } from './item-line-break';
import { ItemLink } from './item-link';
import { ItemList } from './item-list';
import { ItemListItem } from './item-list-item';
import { ItemParagraph } from './item-paragraph';
import { ItemStrikethrough } from './item-strikethrough';
import { ItemStrong } from './item-strong';
import { ItemTable } from './item-table';
import { ItemTableCell } from './item-table-cell';
import { ItemTableHeaderCell } from './item-table-header-cell';
import { ItemTableRow } from './item-table-row';
import { ItemText } from './item-text';
import { ItemThematicBreak } from './item-thematic-break';

export interface ItemProps {
  block: Block;
}

export function Item(props: ItemProps) {
  const { block } = props;
  switch (block.type) {
    case 'text':
      return <ItemText block={block} />;
    case 'heading':
      return <ItemHeading block={block} />;
    case 'paragraph':
      return <ItemParagraph block={block} />;
    case 'link':
      return <ItemLink block={block} />;
    case 'image':
      return <ItemImage block={block} />;
    case 'list':
      return <ItemList block={block} />;
    case 'list-item':
      return <ItemListItem block={block} />;
    case 'emphasis':
      return <ItemEmphasis block={block} />;
    case 'strong':
      return <ItemStrong block={block} />;
    case 'strikethrough':
      return <ItemStrikethrough block={block} />;
    case 'inline-code':
      return <ItemInlineCode block={block} />;
    case 'blockquote':
      return <ItemBlockquote block={block} />;
    case 'thematic-break':
      return <ItemThematicBreak />;
    case 'line-break':
      return <ItemLineBreak />;
    case 'table':
      return <ItemTable block={block} />;
    case 'table-row':
      return <ItemTableRow block={block} />;
    case 'table-header-cell':
      return <ItemTableHeaderCell block={block} />;
    case 'table-cell':
      return <ItemTableCell block={block} />;
    case 'code-block':
      return <ItemCodeBlock block={block} />;
    case 'code-group':
      return <ItemCodeGroup block={block} />;
    case 'callout':
      return <ItemCallout block={block} />;
  }
}
