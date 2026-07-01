import type { BoxProps } from '../box';

import { useEffect } from 'react';

import { useStepFocus } from '#hooks/use-step-focus';

import { Box } from '../box';
import { MenuContext } from './menu-context';

const ITEM_SELECTOR =
  '[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]';

export type MenuBaseProps = BoxProps & {
  'aria-label': string;
  onClose: () => void;
};

export function MenuBase(props: MenuBaseProps) {
  const { children, onClose, ...restProps } = props;

  const { props: stepFocusProps } = useStepFocus<HTMLDivElement>({
    orientation: 'vertical',
    searchable: true,
  });

  useEffect(() => {
    const $element = stepFocusProps.ref.current;
    if ($element === null) {
      return;
    }

    const checkedItem = $element.querySelector<HTMLElement>(
      '[aria-checked="true"]',
    );
    const firstItem = $element.querySelector<HTMLElement>(ITEM_SELECTOR);
    (checkedItem ?? firstItem)?.focus();

    const handlePointerOver = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target === null) {
        return;
      }
      const isItem = target.closest(ITEM_SELECTOR) !== null;
      if (!isItem && $element.contains(target)) {
        $element.focus({
          preventScroll: true,
        });
      }
    };
    $element.addEventListener('pointerover', handlePointerOver);
    return () => {
      $element.removeEventListener('pointerover', handlePointerOver);
    };
  }, [
    stepFocusProps.ref,
  ]);

  return (
    <MenuContext
      value={{
        onClose,
      }}
    >
      <Box
        {...restProps}
        {...stepFocusProps}
        role="menu"
        tabIndex={-1}
      >
        {children}
      </Box>
    </MenuContext>
  );
}
