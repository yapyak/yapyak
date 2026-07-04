import type { TransitionEvent } from 'react';
import type { SwatchAccent } from '#components/swatch';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { OptionMenuTrigger } from '#components/option-menu-trigger';
import { useOptionContext } from '#components/option-provider';
import { useMediaQuery } from '#hooks/use-media-query';
import { visibleOptionsForGroup } from '#lib/adapter';
import { Box } from '#primitives/box';
import { RadioGroupBase } from '#primitives/radio';

import styles from './installation-wizard-group.module.css';
import { InstallationWizardOption } from './installation-wizard-option';
import { doc } from 'virtual:doc-compiler';

type IndicatorState = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type InstallationWizardGroupProps = {
  group: string;
};

export function InstallationWizardGroup(props: InstallationWizardGroupProps) {
  const { group: groupId } = props;
  const { get, set } = useOptionContext();
  const group = doc.getOptionsGroup(groupId);
  const activeFramework = get('framework');
  const isCompact = useMediaQuery('(max-width: 640px)');

  const radioGroupElement = useRef<HTMLDivElement>(null);
  const previousValueRef = useRef<string | null>(null);
  const [indicator, setIndicator] = useState<IndicatorState | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const activeValue = get(groupId);

  useLayoutEffect(() => {
    const $element = radioGroupElement.current;
    if ($element === null) {
      return;
    }

    const measure = () => {
      const activeElement = $element.querySelector('[data-checked]');
      if (!(activeElement instanceof HTMLElement)) {
        return;
      }
      setIndicator({
        height: activeElement.offsetHeight,
        width: activeElement.offsetWidth,
        x: activeElement.offsetLeft,
        y: activeElement.offsetTop,
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe($element);

    if (typeof document !== 'undefined' && document.fonts) {
      void (async () => {
        await document.fonts.ready;
        measure();
      })();
    }

    if (
      previousValueRef.current !== null &&
      previousValueRef.current !== activeValue
    ) {
      setIsAnimating(true);
    }
    previousValueRef.current = activeValue;

    return () => {
      observer.disconnect();
    };
  }, [
    activeValue,
  ]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsReady(true);
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  if (group === undefined) {
    return null;
  }

  const options = visibleOptionsForGroup(
    groupId,
    group.options,
    activeFramework,
  );
  if (options.length < 2) {
    return null;
  }

  const handleChange = (value: string) => {
    set(groupId, value);
  };

  const handleIndicatorTransitionEnd = (
    event: TransitionEvent<HTMLSpanElement>,
  ) => {
    if (event.propertyName !== 'transform') {
      return;
    }
    setIsAnimating(false);
  };

  const indicatorStyle = indicator
    ? {
        '--installation-wizard-indicator-height': `${indicator.height}px`,
        '--installation-wizard-indicator-width': `${indicator.width}px`,
        '--installation-wizard-indicator-x': `${indicator.x}px`,
        '--installation-wizard-indicator-y': `${indicator.y}px`,
      }
    : undefined;

  return (
    <Box className={styles.InstallationWizardGroup}>
      <Box className={styles.Label}>{group.label}</Box>
      {isCompact ? (
        <OptionMenuTrigger group={groupId} />
      ) : (
        <RadioGroupBase
          aria-label={group.label}
          className={styles.RadioGroup}
          data-animating={isAnimating}
          name={`installation-wizard-${groupId}`}
          onChange={handleChange}
          ref={radioGroupElement}
          style={indicatorStyle}
          value={activeValue}
        >
          {indicator && (
            <Box
              aria-hidden={true}
              as="span"
              className={styles.IndicatorBar}
              data-ready={isReady}
              onTransitionEnd={handleIndicatorTransitionEnd}
            />
          )}
          {options.map((option) => (
            <InstallationWizardOption
              accent={option.value as SwatchAccent}
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
        </RadioGroupBase>
      )}
    </Box>
  );
}
