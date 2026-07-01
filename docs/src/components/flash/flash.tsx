import type { SwatchAccent } from '#components/swatch';

import { Box } from '#primitives/box';
import { Portal } from '#systems/portal';

import styles from './flash.module.css';

export type FlashProps = {
  accent: SwatchAccent;
};

export function Flash(props: FlashProps) {
  const { accent } = props;

  return (
    <Portal>
      <Box
        aria-hidden={true}
        className={styles.Flash}
        data-accent={accent}
      />
    </Portal>
  );
}
