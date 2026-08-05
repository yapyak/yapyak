import { useRouter } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';

export function useOnRouteRendered(onRouteRendered: () => void) {
  const router = useRouter();
  const onRouteRenderedRef = useRef(onRouteRendered);

  onRouteRenderedRef.current = onRouteRendered;

  useEffect(
    () =>
      router.subscribe('onRendered', () => {
        onRouteRenderedRef.current();
      }),
    [
      router,
    ],
  );
}
