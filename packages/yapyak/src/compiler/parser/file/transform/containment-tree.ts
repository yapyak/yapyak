import type { ParsedCallSite } from '../extract';

export function buildContainmentTree(
  callSites: ParsedCallSite[],
): Map<ParsedCallSite, ParsedCallSite[]> {
  const childrenByParent = new Map<ParsedCallSite, ParsedCallSite[]>();
  for (const candidateChild of callSites) {
    const parent = findSmallestContainingParent(candidateChild, callSites);
    if (!parent) {
      continue;
    }
    const list = childrenByParent.get(parent) ?? [];
    list.push(candidateChild);
    childrenByParent.set(parent, list);
  }
  return childrenByParent;
}

export function hasContainingParent(
  child: ParsedCallSite,
  callSites: ParsedCallSite[],
): boolean {
  return findSmallestContainingParent(child, callSites) !== undefined;
}

function findSmallestContainingParent(
  child: ParsedCallSite,
  callSites: ParsedCallSite[],
): ParsedCallSite | undefined {
  const childStart = child.range.start.offset;
  const childEnd = child.range.end.offset;
  let smallestParent: ParsedCallSite | undefined;
  let smallestSize = Number.POSITIVE_INFINITY;
  for (const candidate of callSites) {
    if (candidate === child) {
      continue;
    }
    const candidateStart = candidate.range.start.offset;
    const candidateEnd = candidate.range.end.offset;
    if (candidateStart > childStart || candidateEnd < childEnd) {
      continue;
    }
    if (candidateStart === childStart && candidateEnd === childEnd) {
      continue;
    }
    const size = candidateEnd - candidateStart;
    if (size < smallestSize) {
      smallestSize = size;
      smallestParent = candidate;
    }
  }
  return smallestParent;
}
