import { useLayoutEffect } from 'react';
import { flushSync } from 'react-dom';

export function useSynchronizedLayoutEffect(callback: () => void) {
  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      flushSync(callback);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  });
}
