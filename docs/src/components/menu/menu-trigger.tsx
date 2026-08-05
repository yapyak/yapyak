import type { ReactNode } from 'react';
import type { AnimateChildProps } from '#systems/animate';
import type {
  UseMenuTriggerOptions,
  UseMenuTriggerReturn,
} from './use-menu-trigger';

import { Animate } from '#systems/animate';
import { mergeProps } from '#utils/merge-props';

import { useMenuTrigger } from './use-menu-trigger';

type TriggerProps = UseMenuTriggerReturn['triggerProps'];

type RenderedMenuProps = UseMenuTriggerReturn['menuProps'] & AnimateChildProps;

export type MenuTriggerProps = UseMenuTriggerOptions & {
  children: (props: TriggerProps) => ReactNode;
  menu: (props: RenderedMenuProps) => ReactNode;
};

export function MenuTrigger(props: MenuTriggerProps) {
  const { children, initialOpen, menu, onClose, onOpen } = props;

  const { menuProps, open, triggerProps } = useMenuTrigger({
    initialOpen,
    onClose,
    onOpen,
  });

  return (
    <>
      {children(triggerProps)}
      <Animate in={open}>
        {(animateProps) => menu(mergeProps(menuProps, animateProps))}
      </Animate>
    </>
  );
}
