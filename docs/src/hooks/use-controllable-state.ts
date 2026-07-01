import { useCallback, useRef, useState } from 'react';

export type UseControllableStateOptions<T> = {
  defaultValue?: T;
  onChange?: (value: T) => void;
  value?: T;
};

export type UseControllableStateReturn<T> = [
  T | undefined,
  (value: T | ((previous: T | undefined) => T)) => void,
];

export function useControllableState<T>(
  options: UseControllableStateOptions<T>,
): UseControllableStateReturn<T> {
  const { defaultValue, onChange, value: controlledValue } = options;

  const [uncontrolledValue, setUncontrolledValue] = useState<T | undefined>(
    defaultValue,
  );

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const setValue = useCallback(
    (next: T | ((previous: T | undefined) => T)) => {
      const resolved =
        typeof next === 'function'
          ? (next as (previous: T | undefined) => T)(value)
          : next;

      if (!isControlled) {
        setUncontrolledValue(resolved);
      }
      onChangeRef.current?.(resolved);
    },
    [
      isControlled,
      value,
    ],
  );

  return [
    value,
    setValue,
  ];
}
