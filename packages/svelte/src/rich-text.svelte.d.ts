import type {
  Component,
  ComponentConstructorOptions,
  SvelteComponent,
} from 'svelte';
import type { RichTextProps } from './rich-text';

type RichTextComponent = {
  new <T extends string>(
    options: ComponentConstructorOptions<RichTextProps<T>>,
  ): SvelteComponent<RichTextProps<T>>;
  <T extends string>(
    ...args: Parameters<Component<RichTextProps<T>>>
  ): ReturnType<Component<RichTextProps<T>>>;
};

/**
 * Renders rich text by resolving named tags via snippet props.
 *
 * @remarks
 * The prop shape is {@link RichTextProps}.
 *
 * @example
 * ```svelte
 * <RichText value={t('Click <link>here</link>.')}>
 *   {#snippet link(children)}
 *     <a href="/docs">{@render children()}</a>
 *   {/snippet}
 * </RichText>
 * ```
 */
declare const RichText: RichTextComponent;
export default RichText;
