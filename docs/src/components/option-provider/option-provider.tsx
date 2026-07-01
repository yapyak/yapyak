import type { OptionsRegistry } from '@yapyak/doc-compiler';
import type { PropsWithChildren } from 'react';
import type { SwatchAccent } from '#components/swatch';

import { useEffect, useRef, useState } from 'react';

import { useFlash } from '#systems/flash';

import { filterAdaptersByFramework } from '../../adapter';
import { OptionContext } from './option-context';
import {
  OPTION_PREPAINT_STYLE_ID,
  OPTION_STORAGE_PREFIX,
} from './option-storage';
import { doc } from 'virtual:doc-compiler';

function readDefaults(registry: OptionsRegistry) {
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

  const flash = useFlash();
  const previousFrameworkRef = useRef(state.framework);

  useEffect(() => {
    const currentFramework = state.framework;
    if (
      previousFrameworkRef.current !== undefined &&
      previousFrameworkRef.current !== currentFramework &&
      currentFramework !== undefined
    ) {
      flash({
        accent: currentFramework as SwatchAccent,
      });
    }
    previousFrameworkRef.current = currentFramework;
  }, [
    state.framework,
    flash,
  ]);

  useEffect(() => {
    const stored = window.__yapyakOptions ?? {};
    setState((previous) => {
      let hasChanged = false;
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
          hasChanged = true;
        }
      }
      return hasChanged ? next : previous;
    });
    document.getElementById(OPTION_PREPAINT_STYLE_ID)?.remove();
  }, [
    registry,
  ]);

  const get = (groupId: string) => {
    const stored = state[groupId] ?? registry[groupId]?.default ?? '';
    if (groupId !== 'adapter') {
      return stored;
    }
    const framework = state.framework ?? registry.framework?.default ?? '';
    const valid = filterAdaptersByFramework(framework).map(
      (adapter) => adapter.value,
    );
    return valid.includes(stored) ? stored : (valid[0] ?? stored);
  };

  const set = (groupId: string, value: string) => {
    setState((previous) => {
      const next = {
        ...previous,
        [groupId]: value,
      };
      if (groupId === 'framework') {
        const currentAdapter = previous.adapter ?? registry.adapter?.default;
        const valid = filterAdaptersByFramework(value).map(
          (adapter) => adapter.value,
        );
        if (currentAdapter === undefined || !valid.includes(currentAdapter)) {
          const fallback = valid[0] ?? registry.adapter?.default ?? 'none';
          next.adapter = fallback;
          persistOption('adapter', fallback);
        }
      }
      return next;
    });
    persistOption(groupId, value);
  };

  function persistOption(groupId: string, value: string): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(`${OPTION_STORAGE_PREFIX}${groupId}`, value);
    } catch {}
  }

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
