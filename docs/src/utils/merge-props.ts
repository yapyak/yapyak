import type { Ref } from 'react';
import type { Props } from '#types';

import { mergeClassNames } from './merge-class-names';
import { mergeEvents } from './merge-events';
import { mergeRefs } from './merge-refs';
import { mergeStyles } from './merge-styles';

type Prettify<T> = { [K in keyof T]: T[K] } & {};

type UnionToIntersection<T> = (
  T extends unknown
    ? (value: T) => void
    : never
) extends (value: infer TIntersection) => void
  ? TIntersection
  : never;

export function mergeProps<T extends readonly (null | object | undefined)[]>(
  ...args: T
) {
  const result: Props = {};

  for (const props of args) {
    if (!props) {
      continue;
    }

    for (const key in props) {
      const a = result[key];
      const b = (props as Props)[key];

      if (/^on[A-Z]/.test(key) && isEvent(a) && isEvent(b)) {
        result[key] = mergeEvents(a, b);
      } else if (key === 'className') {
        if (isClassName(a) || isClassName(b)) {
          result[key] = mergeClassNames(
            isClassName(a) ? a : undefined,
            isClassName(b) ? b : undefined,
          );
        }
      } else if (key === 'style') {
        if (isStyle(a) || isStyle(b)) {
          result.style = mergeStyles(
            isStyle(a) ? a : undefined,
            isStyle(b) ? b : undefined,
          );
        }
      } else if (key === 'ref') {
        if (isRef(a) || isRef(b)) {
          result.ref = mergeRefs(
            isRef(a) ? a : undefined,
            isRef(b) ? b : undefined,
          );
        }
      } else if (key === 'aria-describedby' || key === 'aria-labelledby') {
        const merged = [
          a,
          b,
        ]
          .filter(Boolean)
          .join(' ');
        if (merged) {
          result[key] = merged;
        }
      } else if (b !== undefined) {
        result[key] = b;
      }
    }
  }

  return result as Prettify<UnionToIntersection<NonNullable<T[number]>>>;
}

function isClassName(input: unknown): input is string | string[] {
  if (Array.isArray(input)) {
    return input.some(isClassName);
  }
  return typeof input === 'string';
}

function isEvent(
  input: unknown,
): input is (
  ...args: unknown[]
) => ((...args: unknown[]) => undefined)[] | undefined {
  if (Array.isArray(input)) {
    return input.some(isEvent);
  }
  return typeof input === 'function';
}

function isRef<T>(input: unknown): input is Ref<T> | Ref<T>[] {
  if (Array.isArray(input)) {
    return input.some(isRef);
  }
  return (
    typeof input === 'function' ||
    (typeof input === 'object' && input !== null && 'current' in input)
  );
}

function isStyle(input: unknown): input is object | object[] {
  if (Array.isArray(input)) {
    return input.some(isStyle);
  }
  return typeof input === 'object' && input !== null;
}
