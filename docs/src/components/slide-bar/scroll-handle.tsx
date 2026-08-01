import type { BoxProps } from '#primitives/box';

import { useRef } from 'react';

import { useEventListener } from '#hooks/use-event-listener';
import { useHoverInterval } from '#hooks/use-hover-interval';
import { Box } from '#primitives/box';
import { mergeProps } from '#utils/merge-props';

import { Icon } from '../icon';
import styles from './scroll-handle.module.css';

export type ScrollHandlePlacement = 'end' | 'start';

export type ScrollHandleProps = BoxProps & {
  disabled?: boolean;
  onPerform: () => void;
  placement: ScrollHandlePlacement;
};

export function ScrollHandle(props: ScrollHandleProps) {
  const { className, disabled, onPerform, placement, ...restProps } = props;

  const element = useRef<HTMLDivElement>(null);

  const { hoverIntervalProps } = useHoverInterval(onPerform, {
    accelerationFactor: 1.1,
    delay: 60,
    disabled,
    minInterval: 0.1,
  });

  const handleWheel = (event: WheelEvent) => {
    event.preventDefault();
  };

  useEventListener(element, 'wheel', handleWheel, {
    passive: false,
  });

  return (
    <Box
      {...mergeProps(restProps, hoverIntervalProps)}
      aria-hidden={true}
      className={[
        styles.ScrollHandle,
        className,
      ]}
      data-placement={placement}
      ref={element}
    >
      <Icon
        className={styles.Chevron}
        name="chevron"
      />
    </Box>
  );
}
