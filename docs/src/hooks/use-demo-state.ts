import type { LocaleCode } from '#utils/hero-demo-scenes';

import { useEffect, useState } from 'react';

import {
  EMPTY_TRANSLATIONS,
  INITIAL_SCENE,
  LOCALES,
  SCENES,
} from '#utils/hero-demo-scenes';

export interface DemoState {
  receiving: boolean;
  savedSource: string;
  saving: boolean;
  shimmering: Set<LocaleCode>;
  source: string;
  translations: Record<LocaleCode, string>;
  typing: boolean;
}

const INITIAL_STATE: DemoState = {
  receiving: false,
  savedSource: INITIAL_SCENE.source,
  saving: false,
  shimmering: new Set(),
  source: INITIAL_SCENE.source,
  translations: INITIAL_SCENE.translations,
  typing: false,
};

export function useDemoState(active: boolean) {
  const [state, setState] = useState<DemoState>(INITIAL_STATE);

  useEffect(() => {
    if (!active) {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    );
    if (reducedMotionQuery.matches) {
      return;
    }

    let isCancelled = false;
    const timeouts = new Set<number>();

    const sleep = (milliseconds: number) =>
      new Promise<void>((resolve) => {
        const timeoutId = window.setTimeout(() => {
          timeouts.delete(timeoutId);
          resolve();
        }, milliseconds);
        timeouts.add(timeoutId);
      });

    const jitter = (base: number, spread: number) =>
      base + Math.random() * spread;

    const run = async () => {
      let currentSource = INITIAL_SCENE.source;
      let sceneIndex = 0;

      while (!isCancelled) {
        const scene = SCENES[sceneIndex % SCENES.length];
        if (scene === undefined) {
          return;
        }

        await sleep(2600);
        if (isCancelled) {
          return;
        }

        setState((previous) => ({ ...previous, typing: true }));

        while (currentSource.length > 0) {
          currentSource = currentSource.slice(0, -1);
          setState((previous) => ({ ...previous, source: currentSource }));
          await sleep(jitter(28, 26));
          if (isCancelled) {
            return;
          }
        }

        await sleep(220);

        for (let index = 0; index < scene.source.length; index++) {
          currentSource = scene.source.slice(0, index + 1);
          setState((previous) => ({ ...previous, source: currentSource }));
          const character = scene.source[index];
          const delay = jitter(48, 70) + (character === ' ' ? 60 : 0);
          await sleep(delay);
          if (isCancelled) {
            return;
          }
        }

        setState((previous) => ({
          ...previous,
          saving: true,
          typing: false,
        }));
        await sleep(1000);
        setState((previous) => ({
          ...previous,
          receiving: true,
          savedSource: scene.source,
          shimmering: new Set(LOCALES.map((locale) => locale.code)),
          translations: EMPTY_TRANSLATIONS,
        }));
        await sleep(360);
        setState((previous) => ({ ...previous, saving: false }));
        await sleep(700);
        if (isCancelled) {
          return;
        }

        setState((previous) => ({
          ...previous,
          shimmering: new Set(),
          translations: scene.translations,
        }));

        setState((previous) => ({ ...previous, receiving: false }));
        await sleep(1100);

        sceneIndex++;
      }
    };

    run();

    return () => {
      isCancelled = true;
      for (const timeoutId of timeouts) {
        window.clearTimeout(timeoutId);
      }
      timeouts.clear();
    };
  }, [active]);

  return state;
}
