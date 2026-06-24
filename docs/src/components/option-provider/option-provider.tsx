import type { OptionsRegistry } from '@yapyak/doc-compiler';
import type { PropsWithChildren } from 'react';

import { useEffect, useState } from 'react';

import { OptionContext } from './option-context';
import {
  OPTION_PREPAINT_STYLE_ID,
  OPTION_STORAGE_PREFIX,
} from './option-storage';
import { doc } from 'virtual:doc-compiler';

function readDefaults(registry: OptionsRegistry): Record<string, string> {
  const initial: Record<string, string> = {};
  for (const [groupId, group] of Object.entries(registry)) {
    initial[groupId] = group.default;
  }
  return initial;
}

export type OptionProviderProps = PropsWithChildren;

export function OptionProvider(props: OptionProviderProps) {
  const { children } = props;
  const registry = doc.getOptions();
  const [state, setState] = useState<Record<string, string>>(() =>
    readDefaults(registry),
  );

  useEffect(() => {
    const stored = window.__yapyakOptions ?? {};
    setState((previous) => {
      let changed = false;
      const next = {
        ...previous,
      };
      for (const [groupId, value] of Object.entries(stored)) {
        if (
          groupId in registry &&
          typeof value === 'string' &&
          value !== '' &&
          next[groupId] !== value
        ) {
          next[groupId] = value;
          changed = true;
        }
      }
      return changed ? next : previous;
    });
    document.getElementById(OPTION_PREPAINT_STYLE_ID)?.remove();
  }, [
    registry,
  ]);

  const get = (groupId: string) =>
    state[groupId] ?? registry[groupId]?.default ?? '';

  const set = (groupId: string, value: string) => {
    setState((previous) => ({
      ...previous,
      [groupId]: value,
    }));
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(`${OPTION_STORAGE_PREFIX}${groupId}`, value);
    } catch {}
  };

  return (
    <OptionContext
      value={{
        get,
        set,
      }}
    >
      {children}
    </OptionContext>
  );
}
