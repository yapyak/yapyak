import type { ReactElement } from 'react';

export type DotsIconProps = {
  size?: number;
};

export function DotsIcon(props: DotsIconProps): ReactElement {
  const { size = 16 } = props;

  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      height={size}
      shapeRendering="geometricPrecision"
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="5"
        cy="12"
        r="1.75"
      />
      <circle
        cx="12"
        cy="12"
        r="1.75"
      />
      <circle
        cx="19"
        cy="12"
        r="1.75"
      />
    </svg>
  );
}
