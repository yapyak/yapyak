import type { PropsWithChildren } from 'react';
import type { FlashEntry, FlashTriggerOptions } from './flash-context';

import { useEffect, useRef, useState } from 'react';

import { FlashContext } from './flash-context';

const FLASH_DURATION_MS = 2400;

export type FlashProviderProps = PropsWithChildren;

export function FlashProvider(props: FlashProviderProps) {
  const { children } = props;
  const [entry, setEntry] = useState<FlashEntry | null>(null);
  const counterRef = useRef(0);
  const timeoutRef = useRef<number>(undefined);

  useEffect(
    () => () => {
      if (timeoutRef.current !== undefined) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  const trigger = (options: FlashTriggerOptions) => {
    counterRef.current += 1;
    setEntry({
      accent: options.accent,
      id: counterRef.current,
    });
    if (timeoutRef.current !== undefined) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setEntry(null);
    }, FLASH_DURATION_MS);
  };

  return (
    <FlashContext
      value={{
        entry,
        trigger,
      }}
    >
      {children}
    </FlashContext>
  );
}
