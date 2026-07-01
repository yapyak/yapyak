import type { ReactNode } from 'react';

import { useRef } from 'react';

import { Box } from '#primitives/box';
import { FlashProvider } from '#systems/flash';
import { PortalProvider } from '#systems/portal';
import { Stack, StackProvider } from '#systems/stack';

import { RootFlashView } from './root-flash-view';

export type RootProps = {
  children?: ReactNode;
};

export function Root(props: RootProps) {
  const { children } = props;

  const element = useRef<HTMLDivElement>(null);

  return (
    <PortalProvider element={element}>
      <StackProvider>
        <FlashProvider>
          <Box ref={element}>
            <Stack>{children}</Stack>
            <RootFlashView />
          </Box>
        </FlashProvider>
      </StackProvider>
    </PortalProvider>
  );
}
