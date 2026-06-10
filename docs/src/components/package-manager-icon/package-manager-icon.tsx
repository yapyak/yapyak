import type { ReactElement } from 'react';

export type PackageManagerIconProps = {
  name: string;
  size?: number;
};

export function PackageManagerIcon(
  props: PackageManagerIconProps,
): ReactElement | null {
  const { name, size = 16 } = props;

  switch (name) {
    case 'npm':
      return (
        <svg
          aria-hidden="true"
          height={size}
          shapeRendering="geometricPrecision"
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"
            fill="#CB3837"
          />
        </svg>
      );

    case 'pnpm':
      return (
        <svg
          aria-hidden="true"
          height={size}
          shapeRendering="geometricPrecision"
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 0v7.5h7.5V0zm8.25 0v7.5h7.5V0zm8.25 0v7.5H24V0zM8.25 8.25v7.5h7.5v-7.5zm8.25 0v7.5H24v-7.5zM0 16.5V24h7.5v-7.5zm8.25 0V24h7.5v-7.5zm8.25 0V24H24v-7.5z"
            fill="#F9AD00"
          />
        </svg>
      );

    case 'bun':
      return (
        <svg
          aria-hidden="true"
          height={size}
          shapeRendering="geometricPrecision"
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 3C5.9 3 1 7 1 12s4.9 8 11 8 11-3 11-8S18.1 3 12 3Z"
            fill="#FBF0DF"
          />
          <path
            d="M12 3C5.9 3 1 7 1 12s4.9 8 11 8 11-3 11-8S18.1 3 12 3Zm0 1.5c5.4 0 9.5 3.4 9.5 7.5s-4.1 6.5-9.5 6.5S2.5 16.1 2.5 12 6.6 4.5 12 4.5Z"
            fill="#0F0E0D"
            fillOpacity="0.15"
          />
          <ellipse
            cx="8.4"
            cy="12"
            fill="#0F0E0D"
            rx="1.25"
            ry="1.7"
          />
          <ellipse
            cx="15.6"
            cy="12"
            fill="#0F0E0D"
            rx="1.25"
            ry="1.7"
          />
          <ellipse
            cx="12"
            cy="15.2"
            fill="#F4B6A3"
            rx="1.6"
            ry="0.85"
          />
        </svg>
      );

    default:
      return null;
  }
}
