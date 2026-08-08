import type { DialogTriggerProps } from '../dialog-trigger';

import { useState } from 'react';

import { useSearchData } from '#hooks/use-search-data';

import { DialogTrigger } from '../dialog-trigger';
import { SearchDialog } from '../search-dialog';
import { SearchDialogButton } from '../search-dialog-button';

export type SearchDialogTriggerProps = Pick<DialogTriggerProps, 'shortcut'>;

export function SearchDialogTrigger(props: SearchDialogTriggerProps) {
  const { shortcut } = props;
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
      {(triggerProps) => <SearchDialogButton {...triggerProps} />}
    </DialogTrigger>
  );
}
