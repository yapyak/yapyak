import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import { useStack } from './use-stack';

const ISOLATION_STYLE = {
  isolation: 'isolate',
} as const;

export type StackProps = BoxProps & {
  onActiveChange?: (isActive: boolean) => void;
};

export function Stack(props: StackProps) {
  const { inert, style, onActiveChange, ...restProps } = props;

  const { active } = useStack({
    onActiveChange,
  });

  return (
    <Box
      {...restProps}
      inert={!active || inert}
      style={[
        ISOLATION_STYLE,
        style,
      ]}
    />
  );
}
