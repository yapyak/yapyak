import type { ReactElement, ReactNode } from 'react';
import type { BoxProps } from '#components/box';

import { useRef } from 'react';

import { Box } from '#components/box';
import { PortalProvider } from '#systems/portal';
import { Stack, StackProvider } from '#systems/stack';

export type RootProps = BoxProps & {
  children?: ReactNode;
};

export function Root(props: RootProps): ReactElement {
  const { children, ...restProps } = props;

  const element = useRef<HTMLDivElement>(null);

  return (
    <PortalProvider element={element}>
      <StackProvider>
        <Box
          {...restProps}
          ref={element}
        >
          <Stack>{children}</Stack>
        </Box>
      </StackProvider>
    </PortalProvider>
  );
}
