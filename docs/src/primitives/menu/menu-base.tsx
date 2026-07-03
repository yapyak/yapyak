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
    rovingTabIndex: true,
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
      const item = target.closest<HTMLElement>(ITEM_SELECTOR);
      if (item !== null) {
        item.focus({
          preventScroll: true,
        });
        return;
      }
      if ($element.contains(target)) {
        $element.focus({
          preventScroll: true,
        });
      }
    };
    const handlePointerLeave = () => {
      $element.focus({
        preventScroll: true,
      });
    };
    $element.addEventListener('pointerover', handlePointerOver);
    $element.addEventListener('pointerleave', handlePointerLeave);
    return () => {
      $element.removeEventListener('pointerover', handlePointerOver);
      $element.removeEventListener('pointerleave', handlePointerLeave);
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
