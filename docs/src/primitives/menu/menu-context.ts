import { createContext, use } from 'react';

export type MenuContextValue = {
  onClose: () => void;
};

export const MenuContext = createContext<MenuContextValue | null>(null);

export function useMenuContext() {
  const context = use(MenuContext);
  if (context === null) {
    throw new Error('useMenuContext must be used within a MenuBase');
  }
  return context;
}
