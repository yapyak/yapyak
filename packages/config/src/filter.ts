import picomatch from 'picomatch';

/** Glob pattern for include/exclude filtering. */
export type FilterPattern = string | RegExp | Array<string | RegExp>;

export function createFilter(
  include: FilterPattern,
  exclude: FilterPattern,
): (path: string) => boolean {
  const includeMatchers = toMatchers(include);
  const excludeMatchers = toMatchers(exclude);
  return (path: string): boolean => {
    for (const matcher of excludeMatchers) {
      if (matcher(path)) {
        return false;
      }
    }
    if (includeMatchers.length === 0) {
      return true;
    }
    for (const matcher of includeMatchers) {
      if (matcher(path)) {
        return true;
      }
    }
    return false;
  };
}

function toMatchers(pattern: FilterPattern): Array<(path: string) => boolean> {
  const patterns = Array.isArray(pattern) ? pattern : [pattern];
  return patterns.map((entry) => {
    if (entry instanceof RegExp) {
      return (path: string): boolean => entry.test(path);
    }
    return picomatch(entry, { dot: true });
  });
}
