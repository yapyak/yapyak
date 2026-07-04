import { MobileDialog } from '#components/mobile-dialog';
import { MobileDialogButton } from '#components/mobile-dialog-button';
import { Animate } from '#systems/animate';

export type MobileDialogTriggerProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function MobileDialogTrigger(props: MobileDialogTriggerProps) {
  const { onOpenChange, open } = props;

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleToggle = () => {
    onOpenChange(!open);
  };

  return (
    <>
      <MobileDialogButton
        onToggle={handleToggle}
        open={open}
      />
      <Animate in={open}>
        {(animateProps) => (
          <MobileDialog
            {...animateProps}
            onClose={handleClose}
          />
        )}
      </Animate>
    </>
  );
}
