import type { Block } from '../../access';

type Ancestor = {
  level: number;
  slug: string;
};

export function prefixHeadingIds(blocks: Block[]): void {
  walk(blocks, []);
}

function walk(blocks: Block[], initialStack: Ancestor[]): void {
  const stack = [
    ...initialStack,
  ];
  for (const block of blocks) {
    if (block.type === 'heading') {
      while (stack.length > 0) {
        const top = stack[stack.length - 1];
        if (top === undefined || top.level < block.level) {
          break;
        }
        stack.pop();
      }
      const segments = [
        ...stack.map((ancestor) => ancestor.slug),
        block.id,
      ].filter((segment) => segment !== '');
      const localSlug = block.id;
      block.id = segments.join('-');
      stack.push({
        level: block.level,
        slug: localSlug,
      });
      continue;
    }
    if (block.type === 'switch') {
      for (const branch of Object.values(block.branches)) {
        walk(branch, stack);
      }
      continue;
    }
    if ('children' in block && Array.isArray(block.children)) {
      walk(block.children, stack);
    }
  }
}
