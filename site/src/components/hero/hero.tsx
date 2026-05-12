import { Link } from '@tanstack/react-router';
import type { ReactElement } from 'react';
import { t } from 'yapyak';

export interface HeroProps {
  heading: string;
  description: string;
}

export function Hero(props: HeroProps): ReactElement {
  const { heading, description } = props;
  return (
    <section className="grid grid-cols-1 items-center gap-12 px-6 py-24 lg:grid-cols-[1fr_auto] mx-auto max-w-5xl">
      <div className="flex max-w-2xl flex-col gap-6">
        <h1 className="text-5xl font-medium tracking-tight md:text-3xl">
          {heading}
        </h1>
        <p className="text-xl text-ink-300">{description}</p>
        <div className="mt-4 flex gap-3">
          <Link
            to="/guide"
            className="rounded-full bg-mint-400 px-6 py-3 font-medium text-bg hover:bg-mint-300"
          >
            {t('Get Started')}
          </Link>
          <a
            href="https://github.com/yapyak/yapyak"
            className="rounded-full bg-surface px-6 py-3 font-medium text-ink-50 hover:bg-surface/70"
          >
            {t('View on GitHub')}
          </a>
        </div>
      </div>
      <HeroMark />
    </section>
  );
}

function HeroMark(): ReactElement {
  return (
    <div className="relative size-48 lg:size-64">
      <div className="absolute inset-0 bg-mint-400 opacity-15 blur-2xl" />
      <svg
        viewBox="0 0 64 64"
        className="relative size-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="hero-bubble" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-aqua)" />
            <stop offset="100%" stopColor="var(--color-mint-500)" />
          </linearGradient>
        </defs>
        <path
          fill="url(#hero-bubble)"
          d="M32 0c17.673 0 32 14.327 32 32s-14.327 32-32 32H8c-4.418 0-8-3.582-8-8V32C0 14.327 14.327 0 32 0Z"
        />
        <circle
          cx="16"
          cy="32"
          r="5"
          fill="var(--color-bg)"
          className="origin-center animate-typing [transform-box:fill-box]"
        />
        <circle
          cx="32"
          cy="32"
          r="5"
          fill="var(--color-bg)"
          className="origin-center animate-typing [animation-delay:0.15s] [transform-box:fill-box]"
        />
        <circle
          cx="48"
          cy="32"
          r="5"
          fill="var(--color-bg)"
          className="origin-center animate-typing [animation-delay:0.3s] [transform-box:fill-box]"
        />
      </svg>
    </div>
  );
}
