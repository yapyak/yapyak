import type { ReactElement, ReactNode } from 'react';
import type {
  UseDialogTriggerOptions,
  UseDialogTriggerReturn,
} from './use-dialog-trigger';

import { useDialogTrigger } from './use-dialog-trigger';

type TriggerProps = UseDialogTriggerReturn['triggerProps'];

type DialogProps = UseDialogTriggerReturn['dialogProps'];

export type DialogTriggerProps = UseDialogTriggerOptions & {
  children: (props: TriggerProps) => ReactNode;
  dialog: (props: DialogProps) => ReactNode;
};

export function DialogTrigger(props: DialogTriggerProps): ReactElement {
  const { children, dialog, initialOpen, onClose, onOpen } = props;

  const { dialogProps, triggerProps } = useDialogTrigger({
    initialOpen,
    onClose,
    onOpen,
  });

  return (
    <>
      {children(triggerProps)}
      {dialog(dialogProps)}
    </>
  );
}
