import type { DialogTriggerProps } from '#components/dialog-trigger';
import type { SearchDialogButtonVariant } from '#components/search-dialog-button';

import { useState } from 'react';

import { DialogTrigger } from '#components/dialog-trigger';
import { SearchDialog } from '#components/search-dialog';
import { SearchDialogButton } from '#components/search-dialog-button';
import { useSearchData } from '#hooks/use-search-data';

export type SearchDialogTriggerProps = Pick<DialogTriggerProps, 'shortcut'> & {
  variant?: SearchDialogButtonVariant;
};

export function SearchDialogTrigger(props: SearchDialogTriggerProps) {
  const { shortcut, variant } = props;
  const [hasOpened, setHasOpened] = useState(false);
  const searchData = useSearchData(hasOpened);

  const handleOpen = () => {
    setHasOpened(true);
  };

  return (
    <DialogTrigger
      dialog={(dialogProps) => (
        <SearchDialog
          {...dialogProps}
          searchData={searchData}
        />
      )}
      onOpen={handleOpen}
      shortcut={shortcut}
    >
      {(triggerProps) => (
        <SearchDialogButton
          {...triggerProps}
          variant={variant}
        />
      )}
    </DialogTrigger>
  );
}
