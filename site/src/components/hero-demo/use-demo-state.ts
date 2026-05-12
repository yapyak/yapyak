import { useEffect, useState } from 'react';
import {
  EMPTY_TRANSLATIONS,
  INITIAL_SCENE,
  LOCALES,
  type LocaleCode,
  SCENES,
} from './scenes';

export interface DemoState {
  source: string;
  translations: Record<LocaleCode, string>;
  shimmering: Set<LocaleCode>;
  saving: boolean;
  typing: boolean;
}

const INITIAL_STATE: DemoState = {
  source: INITIAL_SCENE.source,
  translations: INITIAL_SCENE.translations,
  shimmering: new Set(),
  saving: false,
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
        await sleep(420);
        setState((state) => ({
          ...state,
          saving: false,
          translations: EMPTY_TRANSLATIONS,
          shimmering: new Set(LOCALES.map((locale) => locale.code)),
        }));

        await sleep(420);

        setState((state) => ({ ...state, shimmering: new Set() }));

        await Promise.all(
          LOCALES.map(async (locale) => {
            const target = scene.translations[locale.code];
            for (let index = 0; index < target.length; index++) {
              if (cancelled) {
                return;
              }
              const partial = target.slice(0, index + 1);
              setState((state) => ({
                ...state,
                translations: { ...state.translations, [locale.code]: partial },
              }));
              await sleep(jitter(locale.speed, 25));
            }
          }),
        );

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
