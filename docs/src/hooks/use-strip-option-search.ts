import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useEffect } from 'react';

import { toSearchKey } from '#lib/option';

import { doc } from 'virtual:docs-compiler';

export function useStripOptionSearch(): void {
  const navigate = useNavigate();
  const search = useRouterState({
    select: (state) => state.location.search as Record<string, unknown>,
  });
  const optionKeys = Object.keys(doc.getOptionsRegistry()).map(toSearchKey);
  const hasOptionKey = optionKeys.some((key) => key in search);

  useEffect(() => {
    if (!hasOptionKey) {
      return;
    }
    void navigate({
      hash: (previous) => previous ?? '',
      replace: true,
      search: (previous: Record<string, string | undefined>) => {
        const next: Record<string, string | undefined> = {
          ...previous,
        };
        for (const key of optionKeys) {
          delete next[key];
        }
        return next;
      },
      to: '.',
    });
  }, [
    hasOptionKey,
    navigate,
    optionKeys,
  ]);
}
