import { createContext, useContext } from 'react';

type OptionContextValue = {
  get: (groupId: string) => string;
  set: (groupId: string, value: string) => void;
};

export const OptionContext = createContext<OptionContextValue>({
  get: () => '',
  set: () => {},
});

export function useOptionContext() {
  return useContext(OptionContext);
}
