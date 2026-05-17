import type { Ref, RefObject } from 'react';
import type { ComposableRef } from '#types';

export function mergeRefs<T>(...refs: ComposableRef<T>[]): Ref<T> | undefined {
  const flatRefs: Ref<T>[] = [];

  function flatten(input: ComposableRef<T>) {
    if (Array.isArray(input)) {
      for (const item of input) {
        flatten(item);
      }
    } else if (input) {
      flatRefs.push(input);
    }
  }

  for (const ref of refs) {
    flatten(ref);
  }

  return (value: T) => {
    for (const ref of flatRefs) {
      if (typeof ref === 'function') {
        ref(value);
      } else if (ref && typeof ref === 'object') {
        (ref as RefObject<T>).current = value;
      }
    }
  };
}
