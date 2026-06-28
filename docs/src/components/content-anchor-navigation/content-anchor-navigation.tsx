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
const EDGE_SPRING_STIFFNESS = 180;
const EDGE_SPRING_DAMPING = 12;
const EDGE_KICK_FACTOR = 0.15;
const MAX_FRAME_DT_SEC = 0.032;
const EDGE_REST_THRESHOLD_PX = 0.3;
const EDGE_REST_VELOCITY = 0.3;

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
    let edgeBounce = 0;
    let edgeBounceVelocity = 0;
    let wasAtBottom = false;
    let wasVisible = false;
    let lastScrollY = window.scrollY;
    let lastFrameTime = performance.now();
    const firstId = headings[0]?.id;

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

      const scrollY = window.scrollY;
      const scrollVelocity = dt > 0 ? (scrollY - lastScrollY) / dt : 0;
      lastScrollY = scrollY;

      if (lockedIdRef.current !== null) {
        edgeBounce = 0;
        edgeBounceVelocity = 0;
        wasAtBottom = false;
        return;
      }

      const $element = element.current;
      if (!$element) {
        return;
      }

      const atBottom =
        scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - BOTTOM_THRESHOLD_PX;

      if (atBottom && !wasAtBottom && scrollVelocity > 0) {
        edgeBounceVelocity += scrollVelocity * EDGE_KICK_FACTOR;
      }
      wasAtBottom = atBottom;

      const target = resolveTarget();

      const edgeForce =
        -EDGE_SPRING_STIFFNESS * edgeBounce -
        EDGE_SPRING_DAMPING * edgeBounceVelocity;
      edgeBounceVelocity += edgeForce * dt;
      edgeBounce += edgeBounceVelocity * dt;

      if (target === null) {
        if (
          wasVisible &&
          scrollVelocity < 0 &&
          edgeBounce > -EDGE_REST_THRESHOLD_PX &&
          edgeBounceVelocity > -EDGE_REST_VELOCITY &&
          firstId !== undefined
        ) {
          edgeBounceVelocity += scrollVelocity * EDGE_KICK_FACTOR;
        }

        const inTopBounce =
          firstId !== undefined &&
          (edgeBounce < -EDGE_REST_THRESHOLD_PX ||
            Math.abs(edgeBounceVelocity) > EDGE_REST_VELOCITY);

        if (inTopBounce) {
          const firstItem = itemElementsRef.current.get(firstId);
          if (firstItem) {
            const displayedTop = firstItem.offsetTop + edgeBounce;
            const displayedHeight = firstItem.offsetHeight - edgeBounce;
            $element.style.setProperty('--indicator-top', `${displayedTop}px`);
            $element.style.setProperty(
              '--indicator-height',
              `${displayedHeight}px`,
            );
            setIsVisible(true);
            wasVisible = true;
            rafId = window.requestAnimationFrame(tick);
            return;
          }
        }

        setIsVisible(false);
        wasVisible = false;
        edgeBounce = 0;
        edgeBounceVelocity = 0;
        return;
      }

      let displayedTop = target.top;
      let displayedHeight = target.height;
      if (edgeBounce > 0) {
        displayedHeight = target.height + edgeBounce;
      } else if (edgeBounce < 0) {
        displayedTop = target.top + edgeBounce;
        displayedHeight = target.height - edgeBounce;
      }

      setActiveId(target.activeId);
      setIsVisible(true);
      wasVisible = true;
      $element.style.setProperty('--indicator-top', `${displayedTop}px`);
      $element.style.setProperty('--indicator-height', `${displayedHeight}px`);

      const edgeAtRest =
        Math.abs(edgeBounce) < EDGE_REST_THRESHOLD_PX &&
        Math.abs(edgeBounceVelocity) < EDGE_REST_VELOCITY;
      if (edgeAtRest) {
        return;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    const schedule = () => {
      if (rafId !== undefined) {
        return;
      }
      lastFrameTime = performance.now();
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
