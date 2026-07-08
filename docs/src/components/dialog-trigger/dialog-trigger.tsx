import type { ReactNode } from 'react';
import type { AnimateChildProps } from '#systems/animate';
import type {
  UseDialogTriggerOptions,
  UseDialogTriggerReturn,
} from './use-dialog-trigger';

import { Animate } from '#systems/animate';
import { mergeProps } from '#utils/merge-props';

import { useDialogTrigger } from './use-dialog-trigger';

type TriggerProps = UseDialogTriggerReturn['triggerProps'];

type RenderedDialogProps = UseDialogTriggerReturn['dialogProps'] &
  AnimateChildProps;

export type DialogTriggerProps = UseDialogTriggerOptions & {
  children: (props: TriggerProps) => ReactNode;
  dialog: (props: RenderedDialogProps) => ReactNode;
};

export function DialogTrigger(props: DialogTriggerProps) {
  const {
    children,
    dialog,
    initialOpen,
    onClose,
    onOpen,
    onOpenChange,
    open,
    shortcut,
  } = props;

  const { dialogProps, isOpen, triggerProps } = useDialogTrigger({
    initialOpen,
    onClose,
    onOpen,
    onOpenChange,
    open,
    shortcut,
  });

  return (
    <>
      {children(triggerProps)}
      <Animate in={isOpen}>
        {(animateProps) => dialog(mergeProps(dialogProps, animateProps))}
      </Animate>
    </>
  );
}
