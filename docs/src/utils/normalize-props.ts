import type { Props } from '#types';

export function normalizeProps<T extends Props>(props: T): T {
  const newProps: Props = {};

  for (const key in props) {
    if (key.startsWith('data-')) {
      const value = props[key];

      if (typeof value === 'boolean') {
        newProps[key] = value ? '' : undefined;
      } else {
        newProps[key] = value;
      }
    } else {
      newProps[key] = props[key];
    }
  }

  return newProps as T;
}
