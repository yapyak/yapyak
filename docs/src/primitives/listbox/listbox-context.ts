import { createContext, use } from 'react';

export type ListboxContextValue = {
  getOptionId: (value: string) => string;
  highlightedValue: null | string;
  selectedValue: null | string;
};

export const ListboxContext = createContext<ListboxContextValue | null>(null);

export function useListboxContext() {
  const context = use(ListboxContext);
  if (context === null) {
    throw new Error('useListboxContext must be used within a <ListboxBase>');
  }
  return context;
}
