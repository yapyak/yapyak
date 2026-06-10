import type { OptionsRegistry } from '@yapyak/doc-extractor';
import type { ReactNode } from 'react';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { doc } from 'virtual:doc-extractor';

type OptionsContextValue = {
  get: (groupId: string) => string;
  set: (groupId: string, value: string) => void;
};

const OptionsContext = createContext<OptionsContextValue>({
  get: () => '',
  set: () => {},
});

export function useOptionsContext() {
  return useContext(OptionsContext);
}

export const OPTIONS_STORAGE_PREFIX = 'yapyak.option.';
export const OPTIONS_PREPAINT_STYLE_ID = 'yapyak-options-prepaint';

declare global {
  // biome-ignore lint/style/useConsistentTypeDefinitions: needed
  interface Window {
    __yapyakOptions?: Record<string, string>;
  }
}

function readDefaults(registry: OptionsRegistry): Record<string, string> {
  const initial: Record<string, string> = {};
  for (const [groupId, group] of Object.entries(registry)) {
    initial[groupId] = group.default;
  }
  return initial;
}

export type OptionsProviderProps = {
  children: ReactNode;
};

export function OptionsProvider(props: OptionsProviderProps) {
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
    document.getElementById(OPTIONS_PREPAINT_STYLE_ID)?.remove();
  }, [
    registry,
  ]);

  const get = useCallback(
    (groupId: string) => state[groupId] ?? registry[groupId]?.default ?? '',
    [
      registry,
      state,
    ],
  );

  const set = useCallback((groupId: string, value: string) => {
    setState((previous) => ({
      ...previous,
      [groupId]: value,
    }));
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(`${OPTIONS_STORAGE_PREFIX}${groupId}`, value);
    } catch {}
  }, []);

  return (
    <OptionsContext
      value={{
        get,
        set,
      }}
    >
      {children}
    </OptionsContext>
  );
}

export function buildPrepaintScript(registry: OptionsRegistry): string {
  const groupIds = Object.keys(registry);
  return [
    '(function(){',
    'try {',
    `var prefix = ${JSON.stringify(OPTIONS_STORAGE_PREFIX)};`,
    `var groupIds = ${JSON.stringify(groupIds)};`,
    'var stored = {};',
    'groupIds.forEach(function(g) {',
    '  try {',
    '    var v = localStorage.getItem(prefix + g);',
    '    if (v) stored[g] = v;',
    '  } catch(e) {}',
    '});',
    'window.__yapyakOptions = stored;',
    'var rules = [];',
    'Object.keys(stored).forEach(function(g) {',
    '  var v = stored[g];',
    '  var gs = JSON.stringify(g).slice(1, -1);',
    '  var vs = JSON.stringify(v).slice(1, -1);',
    "  rules.push('[data-switch-group=\"' + gs + '\"] [data-when-value]:not([data-when-value=\"' + vs + '\"]){display:none !important}');",
    "  rules.push('[data-switch-group=\"' + gs + '\"] [data-when-value=\"' + vs + '\"]{display:block !important}');",
    "  rules.push('[data-only-group=\"' + gs + '\"]:not([data-only-value=\"' + vs + '\"]){display:none !important}');",
    "  rules.push('[data-only-group=\"' + gs + '\"][data-only-value=\"' + vs + '\"]{display:block !important}');",
    '});',
    'if (rules.length) {',
    "  var s = document.createElement('style');",
    `  s.id = ${JSON.stringify(OPTIONS_PREPAINT_STYLE_ID)};`,
    "  s.textContent = rules.join('');",
    '  document.head.appendChild(s);',
    '}',
    '} catch(e) {}',
    '})();',
  ].join('');
}
