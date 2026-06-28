import type { HeadingEntry } from '@yapyak/doc-compiler';
import type { BoxProps } from '#components/box';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { t } from 'yapyak';

import { Box } from '#components/box';

import styles from './content-anchor-navigation.module.css';
import { ContentAnchorNavigationItem } from './content-anchor-navigation-item';

const HEADER_OFFSET_PX = 88;
const BOTTOM_THRESHOLD_PX = 4;
const SCROLL_LOCK_FALLBACK_MS = 1200;
const SMOOTHSTEP_EDGE_LOW = 0.4;
const SMOOTHSTEP_EDGE_HIGH = 1;
const STRETCH_STIFFNESS = 200;
const STRETCH_DAMPING = 18;
const SCROLL_VELOCITY_TO_STRETCH = 0.05;
const MAX_STRETCH_PX = 56;
const MAX_FRAME_DT_SEC = 0.032;
const STRETCH_REST_THRESHOLD = 0.4;
const SCROLL_VELOCITY_REST = 1;

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

type ResolvedTarget = {
  activeId: string;
  height: number;
  top: number;
};

export type ContentAnchorNavigationProps = BoxProps<'nav'> & {
  headings: HeadingEntry[];
};

export function ContentAnchorNavigation(props: ContentAnchorNavigationProps) {
  const { className, headings, ...restProps } = props;

  const element = useRef<HTMLElement | null>(null);
  const itemElementsRef = useRef(new Map<string, HTMLAnchorElement>());
  const lockedIdRef = useRef<string | null>(null);
  const lockTimeoutRef = useRef<number>(undefined);
  const lockReleaseRef = useRef<(() => void) | undefined>(undefined);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (headings.length === 0) {
      return;
    }

    const lastHeading = headings[headings.length - 1];
    if (lastHeading === undefined) {
      return;
    }
    const lastId = lastHeading.id;

    let rafId: number | undefined;
    let stretchAmount = 0;
    let stretchVelocity = 0;
    let lastScrollY = window.scrollY;
    let lastFrameTime = performance.now();

    const resolveTarget = (): ResolvedTarget | null => {
      const atBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - BOTTOM_THRESHOLD_PX;
      if (atBottom) {
        const lastItem = itemElementsRef.current.get(lastId);
        if (!lastItem) {
          return null;
        }
        return {
          activeId: lastId,
          height: lastItem.offsetHeight,
          top: lastItem.offsetTop,
        };
      }

      let activeIndex = -1;
      for (let index = 0; index < headings.length; index++) {
        const heading = headings[index];
        if (heading === undefined) {
          continue;
        }
        const headingElement = document.getElementById(heading.id);
        if (!headingElement) {
          continue;
        }
        if (headingElement.getBoundingClientRect().top <= HEADER_OFFSET_PX) {
          activeIndex = index;
        } else {
          break;
        }
      }

      if (activeIndex === -1) {
        return null;
      }

      const activeHeading = headings[activeIndex];
      const nextHeading = headings[activeIndex + 1];
      if (activeHeading === undefined) {
        return null;
      }

      const activeHeadingElement = document.getElementById(activeHeading.id);
      const nextHeadingElement =
        nextHeading === undefined
          ? null
          : document.getElementById(nextHeading.id);
      if (!activeHeadingElement) {
        return null;
      }

      const activeItem = itemElementsRef.current.get(activeHeading.id);
      const nextItem =
        nextHeading === undefined
          ? null
          : (itemElementsRef.current.get(nextHeading.id) ?? null);
      if (!activeItem) {
        return null;
      }

      const sectionTop =
        activeHeadingElement.getBoundingClientRect().top - HEADER_OFFSET_PX;
      const sectionBottom =
        nextHeadingElement === null
          ? sectionTop + window.innerHeight
          : nextHeadingElement.getBoundingClientRect().top - HEADER_OFFSET_PX;
      const sectionHeight = Math.max(1, sectionBottom - sectionTop);
      const progress = clamp(-sectionTop / sectionHeight, 0, 1);
      const lean =
        nextItem === null
          ? 0
          : smoothstep(SMOOTHSTEP_EDGE_LOW, SMOOTHSTEP_EDGE_HIGH, progress);

      const baseTop = activeItem.offsetTop;
      const baseHeight = activeItem.offsetHeight;
      const targetTop = nextItem === null ? baseTop : nextItem.offsetTop;
      const targetHeight =
        nextItem === null ? baseHeight : nextItem.offsetHeight;

      return {
        activeId: activeHeading.id,
        height: baseHeight + (targetHeight - baseHeight) * lean,
        top: baseTop + (targetTop - baseTop) * lean,
      };
    };

    const tick = () => {
      rafId = undefined;
      const now = performance.now();
      const dt = Math.min(MAX_FRAME_DT_SEC, (now - lastFrameTime) / 1000);
      lastFrameTime = now;

      if (lockedIdRef.current !== null) {
        return;
      }

      const $element = element.current;
      if (!$element) {
        return;
      }

      const scrollY = window.scrollY;
      const scrollVelocity = dt > 0 ? (scrollY - lastScrollY) / dt : 0;
      lastScrollY = scrollY;

      const target = resolveTarget();
      if (target === null) {
        setIsVisible(false);
        stretchAmount = 0;
        stretchVelocity = 0;
        return;
      }

      const targetStretch = clamp(
        scrollVelocity * SCROLL_VELOCITY_TO_STRETCH,
        -MAX_STRETCH_PX,
        MAX_STRETCH_PX,
      );
      const stretchAccel =
        -STRETCH_STIFFNESS * (stretchAmount - targetStretch) -
        STRETCH_DAMPING * stretchVelocity;
      stretchVelocity += stretchAccel * dt;
      stretchAmount += stretchVelocity * dt;

      const displayedHeight = target.height + Math.abs(stretchAmount);
      const displayedTop =
        stretchAmount < 0 ? target.top + stretchAmount : target.top;

      setActiveId(target.activeId);
      setIsVisible(true);
      $element.style.setProperty('--indicator-top', `${displayedTop}px`);
      $element.style.setProperty('--indicator-height', `${displayedHeight}px`);

      const stretchAtRest =
        Math.abs(stretchAmount) < STRETCH_REST_THRESHOLD &&
        Math.abs(stretchVelocity) < STRETCH_REST_THRESHOLD &&
        Math.abs(targetStretch) < STRETCH_REST_THRESHOLD;
      const scrollAtRest = Math.abs(scrollVelocity) < SCROLL_VELOCITY_REST;
      if (stretchAtRest && scrollAtRest) {
        return;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    const schedule = () => {
      if (rafId !== undefined) {
        return;
      }
      lastFrameTime = performance.now();
      lastScrollY = window.scrollY;
      rafId = window.requestAnimationFrame(tick);
    };

    window.addEventListener('scroll', schedule, {
      passive: true,
    });
    window.addEventListener('resize', schedule);
    schedule();

    return () => {
      if (rafId !== undefined) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [
    headings,
  ]);

  useLayoutEffect(() => {
    if (lockedIdRef.current === null || activeId === null) {
      return;
    }
    const $element = element.current;
    const itemElement = itemElementsRef.current.get(activeId);
    if (!$element || !itemElement) {
      return;
    }
    $element.style.setProperty('--indicator-top', `${itemElement.offsetTop}px`);
    $element.style.setProperty(
      '--indicator-height',
      `${itemElement.offsetHeight}px`,
    );
  }, [
    activeId,
  ]);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) {
      return;
    }
    const targetElement = document.getElementById(hash);
    if (!targetElement) {
      return;
    }
    if (headings.some((heading) => heading.id === hash)) {
      setActiveId(hash);
    }
    window.requestAnimationFrame(() => {
      targetElement.scrollIntoView({
        behavior: 'auto',
        block: 'start',
      });
    });
  }, [
    headings,
  ]);

  useEffect(
    () => () => {
      if (lockTimeoutRef.current !== undefined) {
        window.clearTimeout(lockTimeoutRef.current);
      }
      if (lockReleaseRef.current !== undefined) {
        window.removeEventListener('scrollend', lockReleaseRef.current);
      }
    },
    [],
  );

  const handleActivate = (id: string) => {
    const targetElement = document.getElementById(id);
    if (!targetElement) {
      return;
    }

    lockedIdRef.current = id;
    setActiveId(id);
    setIsVisible(true);
    setIsLocked(true);

    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });

    if (lockReleaseRef.current !== undefined) {
      window.removeEventListener('scrollend', lockReleaseRef.current);
    }
    if (lockTimeoutRef.current !== undefined) {
      window.clearTimeout(lockTimeoutRef.current);
    }

    const release = () => {
      lockedIdRef.current = null;
      setIsLocked(false);
      if (lockReleaseRef.current !== undefined) {
        window.removeEventListener('scrollend', lockReleaseRef.current);
        lockReleaseRef.current = undefined;
      }
      if (lockTimeoutRef.current !== undefined) {
        window.clearTimeout(lockTimeoutRef.current);
        lockTimeoutRef.current = undefined;
      }
    };

    lockReleaseRef.current = release;
    window.addEventListener('scrollend', release, {
      once: true,
    });
    lockTimeoutRef.current = window.setTimeout(
      release,
      SCROLL_LOCK_FALLBACK_MS,
    );
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <Box
      {...restProps}
      aria-label={t('On this page')}
      as="nav"
      className={[
        styles.ContentAnchorNavigation,
        className,
      ]}
      data-locked={isLocked ? '' : undefined}
      data-visible={isVisible ? '' : undefined}
      ref={element}
    >
      <Box className={styles.Rail}>
        <Box className={styles.Eyebrow}>{t('On this page')}</Box>
        <Box className={styles.List}>
          {headings.map((heading) => (
            <ContentAnchorNavigationItem
              active={activeId === heading.id}
              heading={heading}
              key={heading.id}
              onActivate={handleActivate}
              ref={(itemElement) => {
                if (itemElement) {
                  itemElementsRef.current.set(heading.id, itemElement);
                } else {
                  itemElementsRef.current.delete(heading.id);
                }
              }}
            />
          ))}
        </Box>
        <Box
          aria-hidden="true"
          className={styles.Indicator}
        />
      </Box>
    </Box>
  );
}
