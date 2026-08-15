type RenameEntry = {
  from: string;
  to: string;
};

export type ClassifyNamesResult = {
  extra: string[];
  missing: string[];
  renames: RenameEntry[];
};

const MINIMUM_CANDIDATE_LENGTH = 3;

export function classifyNames(
  expected: string[],
  actual: string[],
): ClassifyNamesResult {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  const unmatched = expected.filter((name) => !actualSet.has(name));
  const extra: string[] = [];
  const renames: RenameEntry[] = [];

  for (const name of actual) {
    if (expectedSet.has(name)) {
      continue;
    }
    const candidate = findSpellingCandidate(name, unmatched);
    if (candidate === undefined) {
      extra.push(name);
      continue;
    }
    unmatched.splice(unmatched.indexOf(candidate), 1);
    renames.push({
      from: name,
      to: candidate,
    });
  }

  return {
    extra,
    missing: unmatched,
    renames,
  };
}

function findSpellingCandidate(
  name: string,
  candidates: string[],
): string | undefined {
  const maximumLengthDifference = Math.max(2, Math.floor(name.length * 0.34));
  let bestDistance = Math.floor(name.length * 0.4) + 1;
  let bestCandidate: string | undefined;

  for (const candidate of candidates) {
    if (Math.abs(candidate.length - name.length) > maximumLengthDifference) {
      continue;
    }
    if (
      candidate.length < MINIMUM_CANDIDATE_LENGTH &&
      candidate.toLowerCase() !== name.toLowerCase()
    ) {
      continue;
    }
    const distance = getEditDistance(name, candidate, bestDistance);
    if (distance === undefined) {
      continue;
    }
    bestDistance = distance;
    bestCandidate = candidate;
  }

  return bestCandidate;
}

function getEditDistance(
  first: string,
  second: string,
  max: number,
): number | undefined {
  let previous = Array.from(
    {
      length: second.length + 1,
    },
    (_, index) => index,
  );
  let current = new Array<number>(second.length + 1);

  for (let row = 1; row <= first.length; row += 1) {
    current[0] = row;
    let rowMinimum = row;
    for (let column = 1; column <= second.length; column += 1) {
      const substitution =
        (previous[column - 1] as number) +
        (first[row - 1] === second[column - 1] ? 0 : 1);
      const deletion = (previous[column] as number) + 1;
      const insertion = (current[column - 1] as number) + 1;
      const distance = Math.min(substitution, deletion, insertion);
      current[column] = distance;
      rowMinimum = Math.min(rowMinimum, distance);
    }
    if (rowMinimum >= max) {
      return undefined;
    }
    const swap = previous;
    previous = current;
    current = swap;
  }

  const result = previous[second.length] as number;
  return result < max ? result : undefined;
}
