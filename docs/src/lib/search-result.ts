import type { SearchData, SearchEntry } from '@yapyak/doc-compiler';

type SearchRange = [
  number,
  number,
];

export type SearchResult = {
  entry: SearchEntry;
  ranges: SearchRange[];
  score: number;
};

const DEFAULT_LIMIT = 20;

export function getSearchResults(
  searchData: SearchData,
  query: string,
  limit = DEFAULT_LIMIT,
) {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length === 0) {
    return [];
  }

  const tokens = normalizedQuery.split(/\s+/);
  const results: SearchResult[] = [];
  for (const entry of searchData.entries) {
    const score = getScore(entry, normalizedQuery, tokens);
    if (score <= 0) {
      continue;
    }
    results.push({
      entry,
      ranges: getRanges(entry.title, normalizedQuery, tokens),
      score,
    });
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

function getScore(entry: SearchEntry, query: string, tokens: string[]) {
  const title = entry.title.toLowerCase();
  const breadcrumb = entry.breadcrumbs.join(' ').toLowerCase();
  const body = entry.body.toLowerCase();
  const collapsedQuery = query.replace(/\s+/g, '');

  const hasEveryToken = tokens.every(
    (token) =>
      title.includes(token) ||
      breadcrumb.includes(token) ||
      body.includes(token),
  );
  if (!hasEveryToken && !isSubsequence(collapsedQuery, title)) {
    return 0;
  }

  const position = title.indexOf(query);
  let score = 0;

  if (title === query) {
    score += 1000;
  } else if (position === 0) {
    score += 500;
  } else if (position > 0) {
    score += Math.max(0, 300 - position);
  }

  if (position >= 0) {
    score += Math.round((query.length / title.length) * 100);
    const before = position > 0 ? title[position - 1] : undefined;
    const after = title[position + query.length];
    if (isBoundary(before) && isBoundary(after)) {
      score += 200;
    }
  }

  let titleTokenHits = 0;
  for (const token of tokens) {
    if (title.includes(token)) {
      titleTokenHits += 1;
    }
  }
  score += titleTokenHits === tokens.length ? 120 : titleTokenHits * 30;

  for (const token of tokens) {
    if (breadcrumb.includes(token)) {
      score += 8;
    }
  }

  for (const token of tokens) {
    if (body.includes(token)) {
      score += 4;
    }
  }

  if (score === 0 && isSubsequence(collapsedQuery, title)) {
    score += 40;
  }

  if (score > 0 && entry.kind === 'page') {
    score += 2;
  }

  return score;
}

const ALPHANUMERIC_RX = /[a-z0-9]/;

function isBoundary(character: string | undefined) {
  return character === undefined || !ALPHANUMERIC_RX.test(character);
}

function isSubsequence(query: string, text: string) {
  if (query.length === 0) {
    return false;
  }
  let index = 0;
  for (const character of text) {
    if (character === query[index]) {
      index += 1;
    }
    if (index === query.length) {
      return true;
    }
  }
  return false;
}

function getRanges(title: string, query: string, tokens: string[]) {
  const lowerTitle = title.toLowerCase();
  const phrase = getRange(lowerTitle, query);
  if (phrase !== undefined) {
    return [
      phrase,
    ];
  }

  const ranges: SearchRange[] = [];
  for (const token of tokens) {
    const range = getRange(lowerTitle, token);
    if (range !== undefined) {
      ranges.push(range);
    }
  }
  return mergeRanges(ranges);
}

function getRange(text: string, query: string): SearchRange | undefined {
  const position = text.indexOf(query);
  if (position < 0) {
    return undefined;
  }
  return [
    position,
    position + query.length,
  ];
}

function mergeRanges(ranges: SearchRange[]) {
  const sorted = [
    ...ranges,
  ].sort((a, b) => a[0] - b[0]);
  const merged: SearchRange[] = [];
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];
    if (last !== undefined && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([
        start,
        end,
      ]);
    }
  }
  return merged;
}
