import type { YapyakFilterPattern } from './types';

import picomatch from 'picomatch';

/**
 * Creates a path-matching filter from include/exclude glob patterns.
 *
 * @param include - Patterns to match. Path passes if at least one matches.
 * @param exclude - Patterns to reject. Path fails if any matches.
 * @returns A predicate that returns `true` when `path` should be included.
 *
 * @example Filter source files
 * ```ts
 * import { createFilter } from '@yapyak/config/internal';
 *
 * const filter = createFilter(['**\/*.ts'], ['**\/node_modules/**']);
 * filter('src/app.ts'); // => true
 * filter('node_modules/lib.ts'); // => false
 * ```
 */
export function createFilter(
  include: YapyakFilterPattern,
  exclude: YapyakFilterPattern,
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

function toMatchers(
  pattern: YapyakFilterPattern,
): Array<(path: string) => boolean> {
  const patterns = Array.isArray(pattern) ? pattern : [pattern];
  return patterns.map((entry) => {
    if (entry instanceof RegExp) {
      return (path: string): boolean => entry.test(path);
    }
    return picomatch(entry, { dot: true });
  });
}
