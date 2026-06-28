import type { TerminalBlock } from '@yapyak/doc-compiler';

import { Terminal } from '#components/terminal';

export type BlockRendererNodeTerminalProps = {
  block: TerminalBlock;
};

export function BlockRendererNodeTerminal(
  props: BlockRendererNodeTerminalProps,
) {
  const { block } = props;
  return <Terminal lines={block.lines} />;
}
