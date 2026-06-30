import type { RefObject } from 'react';

export function toValue<T>(value: RefObject<T> | T): T {
  if (value && typeof value === 'object' && 'current' in value) {
    return value.current;
  }
  return value;
}
