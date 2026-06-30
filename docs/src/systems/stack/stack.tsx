import type { ReactElement } from 'react';
import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import { useStack } from './use-stack';

export type StackProps = BoxProps & {
  onActiveChange?: (isActive: boolean) => void;
};

export function Stack(props: StackProps): ReactElement {
  const { inert, style, onActiveChange, ...restProps } = props;

  const { isActive } = useStack({
    onActiveChange,
  });

  return (
    <Box
      {...restProps}
      inert={!isActive || inert}
      style={[
        {
          isolation: 'isolate',
        },
        style,
      ]}
    />
  );
}
