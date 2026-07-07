import type { DialogTriggerProps } from '#components/dialog-trigger';
import type { SearchDialogButtonVariant } from '#components/search-dialog-button';

import { useNavigate } from '@tanstack/react-router';
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
  const navigate = useNavigate();
  const [hasOpened, setHasOpened] = useState(false);
  const searchData = useSearchData(hasOpened);

  const handleSearchDialogSelect = (href: string) => {
    const hashIndex = href.indexOf('#');
    const pathname = hashIndex < 0 ? href : href.slice(0, hashIndex);
    const hash = hashIndex < 0 ? undefined : href.slice(hashIndex + 1);

    void navigate({
      hash,
      to: pathname,
    });
  };

  const handleOpen = () => {
    setHasOpened(true);
  };

  return (
    <DialogTrigger
      dialog={(dialogProps) => (
        <SearchDialog
          {...dialogProps}
          onSelect={handleSearchDialogSelect}
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
