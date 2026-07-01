import type { ReactNode } from 'react';
import type { AnimateChildProps } from '#systems/animate';
import type {
  UsePopoverTriggerOptions,
  UsePopoverTriggerReturn,
} from './use-popover-trigger';

import { Animate } from '#systems/animate';
import { mergeProps } from '#utils/merge-props';

import { usePopoverTrigger } from './use-popover-trigger';

type TriggerProps = UsePopoverTriggerReturn['triggerProps'];

type RenderedPopoverProps = UsePopoverTriggerReturn['popoverProps'] &
  AnimateChildProps;

export type PopoverTriggerProps = UsePopoverTriggerOptions & {
  children: (props: TriggerProps) => ReactNode;
  popover: (props: RenderedPopoverProps) => ReactNode;
};

export function PopoverTrigger(props: PopoverTriggerProps) {
  const { children, initialOpen, popover, onClose, onOpen } = props;

  const { isOpen, popoverProps, triggerProps } = usePopoverTrigger({
    initialOpen,
    onClose,
    onOpen,
  });

  return (
    <>
      {children(triggerProps)}
      <Animate in={isOpen}>
        {(animateProps) => popover(mergeProps(popoverProps, animateProps))}
      </Animate>
    </>
  );
}
