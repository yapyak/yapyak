import type { ReactElement, ReactNode } from 'react';
import type { StackEntry } from './stack-context';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import { StackContext } from './stack-context';

export type StackProviderProps = {
  children: ReactNode;
};

export function StackProvider(props: StackProviderProps): ReactElement {
  const { children } = props;

  const [entries, setEntries] = useState<StackEntry[]>([]);
  const previousEntriesRef = useRef<StackEntry[]>(entries);

  function register(id: string, lastFocusedElement: Element | null) {
    setEntries((prev) => [
      ...prev,
      {
        id,
        lastFocusedElement,
      },
    ]);
    return () => {
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    };
  }

  useLayoutEffect(() => {
    const previous = previousEntriesRef.current;

    const removed = previous.find(
      (prev) => !entries.some((entry) => entry.id === prev.id),
    );

    if (entries.length < previous.length && removed) {
      const $element = removed.lastFocusedElement;
      if ($element instanceof HTMLElement && $element.isConnected) {
        $element.focus({
          preventScroll: true,
        });
      }
    }

    previousEntriesRef.current = entries;
  }, [
    entries,
  ]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: yap yap yap
  const value = useMemo(
    () => ({
      entries,
      register,
    }),
    [
      entries,
    ],
  );

  return <StackContext value={value}>{children}</StackContext>;
}
