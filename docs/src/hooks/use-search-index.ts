import type { SearchIndex } from '@yapyak/doc-compiler';

import { useEffect, useState } from 'react';

const SEARCH_INDEX_URL = '/search-index.json';

export function useSearchIndex(enabled: boolean) {
  const [index, setIndex] = useState<SearchIndex>();

  useEffect(() => {
    if (!enabled || index !== undefined) {
      return;
    }
    let isCancelled = false;
    void (async () => {
      const response = await fetch(SEARCH_INDEX_URL);
      const data: SearchIndex = await response.json();
      if (!isCancelled) {
        setIndex(data);
      }
    })();
    return () => {
      isCancelled = true;
    };
  }, [
    enabled,
    index,
  ]);

  return index;
}
