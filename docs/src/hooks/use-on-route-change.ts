import { useLocation } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';

export function useOnRouteChange(onRouteChange: () => void) {
  const location = useLocation();
  const initialPathnameRef = useRef(location.pathname);
  const initialHashRef = useRef(location.hash);
  const onRouteChangeRef = useRef(onRouteChange);

  onRouteChangeRef.current = onRouteChange;

  useEffect(() => {
    if (
      location.pathname !== initialPathnameRef.current ||
      location.hash !== initialHashRef.current
    ) {
      onRouteChangeRef.current();
      initialPathnameRef.current = location.pathname;
      initialHashRef.current = location.hash;
    }
  }, [
    location.pathname,
    location.hash,
  ]);
}
