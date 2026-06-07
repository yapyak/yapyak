import type { TranslationExample } from '../../translator';
import type { LocaleData, OrphanCache } from './locale';

export interface ExtractExamplesInput {
  currentFileId: string;
  excludeKey: string;
  locale: string;
  localeData: LocaleData;
  max: number;
  orphans: OrphanCache;
  source: string;
}

interface Candidate {
  fileId: string;
  score: number;
  source: string;
  translation: string;
}

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
    for (const [key, translation] of Object.entries(entries)) {
      if (!translation) {
        continue;
      }
      if (fileId === input.currentFileId && key === input.excludeKey) {
        continue;
      }
      const source = sourceFromKey(key);
      candidates.push({
        fileId,
        score: similarity(input.source, source),
        source,
        translation,
      });
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
      const source = sourceFromKey(key);
      candidates.push({
        fileId,
        score: similarity(input.source, source),
        source,
        translation,
      });
    }
  }
  return candidates;
}

function sourceFromKey(key: string): string {
  const at = key.indexOf('@');
  return at === -1 ? key : key.slice(0, at);
}

function dedupeBySource(candidates: Candidate[]): Candidate[] {
  const bestBySource = new Map<string, Candidate>();
  for (const candidate of candidates) {
    const existing = bestBySource.get(candidate.source);
    if (!existing || candidate.score > existing.score) {
      bestBySource.set(candidate.source, candidate);
    }
  }
  return [...bestBySource.values()];
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
  return { source: candidate.source, translation: candidate.translation };
}

function similarity(a: string, b: string): number {
  if (a === b) {
    return 1;
  }
  const wordsA = tokenize(a);
  const wordsB = tokenize(b);
  if (wordsA.length === 0 || wordsB.length === 0) {
    return 0;
  }
  const distance = wordLevenshtein(wordsA, wordsB);
  const maxLength = Math.max(wordsA.length, wordsB.length);
  return 1 - distance / maxLength;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replaceAll(/[\d\p{P}]/gu, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0);
}

function wordLevenshtein(a: string[], b: string[]): number {
  if (a.length === 0) {
    return b.length;
  }
  if (b.length === 0) {
    return a.length;
  }
  let previous: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  let current: number[] = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    current[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        (current[j - 1] ?? 0) + 1,
        (previous[j] ?? 0) + 1,
        (previous[j - 1] ?? 0) + cost,
      );
    }
    [previous, current] = [current, previous];
  }
  return previous[b.length] ?? 0;
}
