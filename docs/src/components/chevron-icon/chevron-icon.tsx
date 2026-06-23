import type { SVGProps } from 'react';

export type ChevronIconProps = SVGProps<SVGSVGElement> & {
  direction?: 'down' | 'left' | 'right' | 'up';
};

const ROTATION_MAP: Record<
  NonNullable<ChevronIconProps['direction']>,
  number
> = {
  down: 0,
  left: 90,
  right: -90,
  up: 180,
};

export function ChevronIcon(props: ChevronIconProps) {
  const { direction = 'down', style, ...restProps } = props;
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="1em"
      viewBox="0 0 24 24"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      {...restProps}
      style={{
        transform: `rotate(${ROTATION_MAP[direction]}deg)`,
        ...style,
      }}
    >
      <path
        d="M7 10l5 5 5-5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
