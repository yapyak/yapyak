import type { ReactNode } from 'react';
import type { ComposableRef } from '#types';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { AnimateContext } from './animate-context';
import { useAnimateContext } from './use-animate-context';

export type AnimateChildProps = {
  'data-animate'?: 'enter' | 'exit';
  inert?: true;
  ref: ComposableRef<HTMLDivElement>;
};

export type AnimateProps = {
  children: (props: AnimateChildProps) => ReactNode;
  in: boolean;
};

type State = 'enter' | 'exit' | 'idle' | 'unmounted';

export function Animate(props: AnimateProps) {
  const { children, in: inProp } = props;

  const parentState = useAnimateContext();
  const isOpen = inProp && parentState !== 'exit';

  const element = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>(isOpen ? 'enter' : 'unmounted');

  useLayoutEffect(() => {
    setState((prev) => {
      if (isOpen) {
        if (prev === 'unmounted') {
          return 'enter';
        }
        if (prev === 'exit') {
          return 'idle';
        }
        return prev;
      }
      if (prev === 'enter' || prev === 'idle') {
        return 'exit';
      }
      return prev;
    });
  }, [
    isOpen,
  ]);

  useLayoutEffect(() => {
    if (state !== 'enter') {
      return;
    }
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        setState('idle');
      });
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [
    state,
  ]);

  useEffect(() => {
    if (state !== 'exit') {
      return;
    }
    const $element = element.current;
    if (!$element) {
      setState('unmounted');
      return;
    }
    const duration = getTransitionDuration($element);
    if (duration === 0) {
      setState('unmounted');
      return;
    }
    const timer = window.setTimeout(() => {
      setState('unmounted');
    }, duration);
    return () => {
      window.clearTimeout(timer);
    };
  }, [
    state,
  ]);

  if (state === 'unmounted') {
    return null;
  }
  const childProps: AnimateChildProps = {
    ref: element,
  };
  if (state === 'enter') {
    childProps['data-animate'] = 'enter';
  } else if (state === 'exit') {
    childProps['data-animate'] = 'exit';
    childProps.inert = true;
  }
  return <AnimateContext value={state}>{children(childProps)}</AnimateContext>;
}

function getTransitionDuration($element: HTMLElement): number {
  const style = window.getComputedStyle($element);
  const durations = style.transitionDuration.split(',');
  const delays = style.transitionDelay.split(',');
  let max = 0;
  for (let i = 0; i < durations.length; i++) {
    const total =
      parseTime(durations[i] ?? '0s') + parseTime(delays[i] ?? '0s');
    if (total > max) {
      max = total;
    }
  }
  return max;
}

function parseTime(value: string): number {
  const trimmed = value.trim();
  if (trimmed.endsWith('ms')) {
    return Number.parseFloat(trimmed);
  }
  if (trimmed.endsWith('s')) {
    return Number.parseFloat(trimmed) * 1000;
  }
  return 0;
}
