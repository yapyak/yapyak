import type { TranslationExample } from '../../translator';
import type { LocaleData, OrphanCache } from './locale';

import { fromMessageKey, toMessageKey } from '../parser';
import { toVariants } from './locale';

export type ExtractExamplesInput = {
  currentFileId: string;
  excludeKey: string;
  locale: string;
  localeData: LocaleData;
  max: number;
  orphans: OrphanCache;
  source: string;
};

type Candidate = {
  fileId: string;
  score: number;
  source: string;
  translation: string;
};

export function extractExamples(
  input: ExtractExamplesInput,
): TranslationExample[] {
  if (input.max <= 0) {
    return [];
  }
  const candidates: Candidate[] = [
    ...candidatesFromLocaleData(input),
    ...candidatesFromOrphans(input),
  ];
  const deduped = dedupeBySource(candidates);
  deduped.sort(makeCandidateComparator(input.currentFileId));
  return deduped.slice(0, input.max).map(toExample);
}

function candidatesFromLocaleData(input: ExtractExamplesInput): Candidate[] {
  const localeFile = input.localeData[input.locale];
  if (!localeFile) {
    return [];
  }
  const candidates: Candidate[] = [];
  for (const [fileId, entries] of Object.entries(localeFile)) {
    for (const [source, entry] of Object.entries(entries)) {
      for (const { context, value } of toVariants(entry)) {
        if (!value) {
          continue;
        }
        if (
          fileId === input.currentFileId &&
          toMessageKey(source, context) === input.excludeKey
        ) {
          continue;
        }
        candidates.push({
          fileId,
          score: getSimilarity(input.source, source),
          source,
          translation: value,
        });
      }
    }
  }
  return candidates;
}

function candidatesFromOrphans(input: ExtractExamplesInput): Candidate[] {
  const candidates: Candidate[] = [];
  for (const [fileId, entries] of Object.entries(input.orphans)) {
    for (const [key, entry] of Object.entries(entries)) {
      const translation = entry.translations[input.locale];
      if (!translation) {
        continue;
      }
      if (fileId === input.currentFileId && key === input.excludeKey) {
        continue;
      }
      const source = fromMessageKey(key).source;
      candidates.push({
        fileId,
        score: getSimilarity(input.source, source),
        source,
        translation,
      });
    }
  }
  return candidates;
}

function dedupeBySource(candidates: Candidate[]): Candidate[] {
  const bestBySource = new Map<string, Candidate>();
  for (const candidate of candidates) {
    const existing = bestBySource.get(candidate.source);
    if (!existing || candidate.score > existing.score) {
      bestBySource.set(candidate.source, candidate);
    }
  }
  return [
    ...bestBySource.values(),
  ];
}

function makeCandidateComparator(
  currentFileId: string,
): (a: Candidate, b: Candidate) => number {
  return (a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score;
    }
    const aSame = a.fileId === currentFileId ? 0 : 1;
    const bSame = b.fileId === currentFileId ? 0 : 1;
    if (aSame !== bSame) {
      return aSame - bSame;
    }
    if (a.source < b.source) {
      return -1;
    }
    if (a.source > b.source) {
      return 1;
    }
    return 0;
  };
}

function toExample(candidate: Candidate): TranslationExample {
  return {
    source: candidate.source,
    translation: candidate.translation,
  };
}

function getSimilarity(source: string, candidateSource: string): number {
  if (source === candidateSource) {
    return 1;
  }
  const sourceWords = tokenize(source);
  const candidateWords = tokenize(candidateSource);
  if (sourceWords.length === 0 || candidateWords.length === 0) {
    return 0;
  }
  const distance = getWordLevenshteinDistance(sourceWords, candidateWords);
  const maxLength = Math.max(sourceWords.length, candidateWords.length);
  return 1 - distance / maxLength;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replaceAll(/[\d\p{P}]/gu, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0);
}

function getWordLevenshteinDistance(
  sourceWords: string[],
  targetWords: string[],
): number {
  if (sourceWords.length === 0) {
    return targetWords.length;
  }
  if (targetWords.length === 0) {
    return sourceWords.length;
  }
  let previous: number[] = Array.from(
    {
      length: targetWords.length + 1,
    },
    (_, index) => index,
  );
  let current: number[] = new Array(targetWords.length + 1).fill(0);
  for (let sourceIndex = 1; sourceIndex <= sourceWords.length; sourceIndex++) {
    current[0] = sourceIndex;
    for (
      let targetIndex = 1;
      targetIndex <= targetWords.length;
      targetIndex++
    ) {
      const cost =
        sourceWords[sourceIndex - 1] === targetWords[targetIndex - 1] ? 0 : 1;
      current[targetIndex] = Math.min(
        (current[targetIndex - 1] ?? 0) + 1,
        (previous[targetIndex] ?? 0) + 1,
        (previous[targetIndex - 1] ?? 0) + cost,
      );
    }
    [previous, current] = [
      current,
      previous,
    ];
  }
  return previous[targetWords.length] ?? 0;
}
