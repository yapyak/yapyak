import type { SearchData } from '@yapyak/docs-compiler';

import { useEffect, useState } from 'react';

const SEARCH_DATA_URL = '/search-data.json';

export function useSearchData(enabled: boolean) {
  const [searchData, setSearchData] = useState<SearchData>();

  useEffect(() => {
    if (!enabled || searchData !== undefined) {
      return;
    }
    let isCancelled = false;
    void (async () => {
      try {
        const response = await fetch(SEARCH_DATA_URL);
        if (!response.ok) {
          return;
        }
        const data: SearchData = await response.json();
        if (!isCancelled) {
          setSearchData(data);
        }
      } catch {
        // Search stays unavailable when the data can't be loaded.
      }
    })();
    return () => {
      isCancelled = true;
    };
  }, [
    enabled,
    searchData,
  ]);

  return searchData;
}
