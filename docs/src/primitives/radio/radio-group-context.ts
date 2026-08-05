import { createContext, use } from 'react';

export type RadioGroupContextValue = {
  disabled: boolean;
  name: string;
  setValue: (value: string) => void;
  value: string | undefined;
};

export const RadioGroupContext = createContext<RadioGroupContextValue | null>(
  null,
);

export function useRadioGroupContext() {
  const context = use(RadioGroupContext);
  if (context === null) {
    throw new Error(
      'useRadioGroupContext must be used within a RadioGroupBase',
    );
  }
  return context;
}
