import type { SVGProps } from 'react';

export interface ChevronIconProps extends SVGProps<SVGSVGElement> {
  direction?: 'down' | 'left' | 'right' | 'up';
}

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
      viewBox="0 0 16 16"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      {...restProps}
      style={{
        transform: `rotate(${ROTATION_MAP[direction]}deg)`,
        ...style,
      }}
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
