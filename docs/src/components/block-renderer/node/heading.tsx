import type { HeadingBlock } from '#lib/content';

import { Box } from '#components/box';

import { BlockRendererNode } from '../node';

export interface NodeHeadingProps {
  block: HeadingBlock;
}

export function NodeHeading(props: NodeHeadingProps) {
  const { block } = props;
  return (
    <Box
      as={headingTag(block.level)}
      id={block.id}
    >
      {block.children.map((child, index) => (
        <BlockRendererNode
          block={child}
          key={index}
        />
      ))}
    </Box>
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
