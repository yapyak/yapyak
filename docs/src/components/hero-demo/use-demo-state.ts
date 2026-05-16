import type { LocaleCode } from './scenes';

import { useEffect, useState } from 'react';

import { EMPTY_TRANSLATIONS, INITIAL_SCENE, LOCALES, SCENES } from './scenes';

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

export function useDemoState(active: boolean): DemoState {
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

    let cancelled = false;
    const timeouts = new Set<number>();

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        const id = window.setTimeout(() => {
          timeouts.delete(id);
          resolve();
        }, ms);
        timeouts.add(id);
      });

    const jitter = (base: number, spread: number) =>
      base + Math.random() * spread;

    const run = async () => {
      let currentSource = INITIAL_SCENE.source;
      let sceneIndex = 0;

      while (!cancelled) {
        const scene = SCENES[sceneIndex % SCENES.length];
        if (scene === undefined) {
          return;
        }

        await sleep(2600);
        if (cancelled) {
          return;
        }

        setState((state) => ({ ...state, typing: true }));

        while (currentSource.length > 0) {
          currentSource = currentSource.slice(0, -1);
          setState((state) => ({ ...state, source: currentSource }));
          await sleep(jitter(28, 26));
          if (cancelled) {
            return;
          }
        }

        await sleep(220);

        for (let index = 0; index < scene.source.length; index++) {
          currentSource = scene.source.slice(0, index + 1);
          setState((state) => ({ ...state, source: currentSource }));
          const character = scene.source[index];
          const delay = jitter(48, 70) + (character === ' ' ? 60 : 0);
          await sleep(delay);
          if (cancelled) {
            return;
          }
        }

        setState((state) => ({ ...state, typing: false }));

        await sleep(360);

        setState((state) => ({ ...state, saving: true }));
        await sleep(360);
        setState((state) => ({ ...state, saving: false }));
        await sleep(240);
        setState((state) => ({
          ...state,
          receiving: true,
          savedSource: scene.source,
          shimmering: new Set(LOCALES.map((locale) => locale.code)),
          translations: EMPTY_TRANSLATIONS,
        }));
        await sleep(360);
        setState((state) => ({ ...state, receiving: false }));
        await sleep(120);

        for (let index = 0; index < LOCALES.length; index++) {
          const locale = LOCALES[index];
          if (locale === undefined) {
            continue;
          }
          setState((state) => {
            const nextShimmering = new Set(state.shimmering);
            nextShimmering.delete(locale.code);
            return {
              ...state,
              shimmering: nextShimmering,
              translations: {
                ...state.translations,
                [locale.code]: scene.translations[locale.code],
              },
            };
          });
          if (cancelled) {
            return;
          }
          await sleep(130);
        }

        await sleep(1100);

        sceneIndex++;
      }
    };

    run();

    return () => {
      cancelled = true;
      for (const id of timeouts) {
        window.clearTimeout(id);
      }
      timeouts.clear();
    };
  }, [active]);

  return state;
}
