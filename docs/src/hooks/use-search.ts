import type { SearchData } from '@yapyak/doc-compiler';

import { useEffect, useState } from 'react';

const SEARCH_URL = '/search.json';

export function useSearch(enabled: boolean) {
  const [searchData, setSearchData] = useState<SearchData>();

  useEffect(() => {
    if (!enabled || searchData !== undefined) {
      return;
    }
    let isCancelled = false;
    void (async () => {
      const response = await fetch(SEARCH_URL);
      const data: SearchData = await response.json();
      if (!isCancelled) {
        setSearchData(data);
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
