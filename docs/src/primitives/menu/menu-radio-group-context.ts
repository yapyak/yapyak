import { createContext, use } from 'react';

export type MenuRadioGroupContextValue = {
  onChange: (value: string) => void;
  value: string | undefined;
};

export const MenuRadioGroupContext =
  createContext<MenuRadioGroupContextValue | null>(null);

export function useMenuRadioGroupContext() {
  const context = use(MenuRadioGroupContext);
  if (context === null) {
    throw new Error(
      'useMenuRadioGroupContext must be used within a MenuBaseRadioGroup',
    );
  }
  return context;
}
