import type { ReactElement, ReactNode } from 'react';

import { useRef } from 'react';

import { Box } from '#primitives/box';
import { PortalProvider } from '#systems/portal';
import { Stack, StackProvider } from '#systems/stack';

export type RootProps = {
  children?: ReactNode;
};

export function Root(props: RootProps): ReactElement {
  const { children } = props;

  const element = useRef<HTMLDivElement>(null);

  return (
    <PortalProvider element={element}>
      <StackProvider>
        <Box ref={element}>
          <Stack>{children}</Stack>
        </Box>
      </StackProvider>
    </PortalProvider>
  );
}
