import type { ReactElement, SVGProps } from 'react';

export type HashIconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export function HashIcon(props: HashIconProps): ReactElement {
  const { size = 16, ...restProps } = props;

  return (
    <svg
      {...restProps}
      aria-hidden="true"
      fill="none"
      height={size}
      shapeRendering="geometricPrecision"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.25"
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <line
        x1="4"
        x2="20"
        y1="9"
        y2="9"
      />
      <line
        x1="4"
        x2="20"
        y1="15"
        y2="15"
      />
      <line
        x1="10"
        x2="8"
        y1="3"
        y2="21"
      />
      <line
        x1="16"
        x2="14"
        y1="3"
        y2="21"
      />
    </svg>
  );
}
