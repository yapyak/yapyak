import type { AstroComponentFactory } from 'astro/runtime/server';

/**
 * Props for {@link RichText}.
 */
export type RichTextProps = {
  /** The source string. */
  value: string;
};

declare const RichText: AstroComponentFactory;
export default RichText;
