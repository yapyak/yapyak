import picomatch from 'picomatch';

import type { FilterPattern } from '../type';

export function createFilter(
  include: FilterPattern,
  exclude: FilterPattern,
): (path: string) => boolean {
  const includeMatcher = toMatcher(include);
  const excludeMatcher = toMatcher(exclude);
  return (path: string): boolean => {
    if (excludeMatcher(path)) {
      return false;
    }
    return includeMatcher(path);
  };
}

function toMatcher(pattern: FilterPattern): (path: string) => boolean {
  if (pattern instanceof RegExp) {
    return (path) => pattern.test(path);
  }
  const patterns = Array.isArray(pattern) ? pattern : [pattern];
  const matchers = patterns.map((entry) => {
    if (entry instanceof RegExp) {
      return (path: string): boolean => entry.test(path);
    }
    const matcher = picomatch(entry);
    return (path: string): boolean => matcher(path);
  });
  return (path: string): boolean => matchers.some((match) => match(path));
}
