import type {
  Component,
  ComponentConstructorOptions,
  SvelteComponent,
} from 'svelte';
import type { RichTextProps } from './rich-text';

interface RichTextComponent {
  new <T extends string>(
    options: ComponentConstructorOptions<RichTextProps<T>>,
  ): SvelteComponent<RichTextProps<T>>;
  <T extends string>(
    ...args: Parameters<Component<RichTextProps<T>>>
  ): ReturnType<Component<RichTextProps<T>>>;
}

/**
 * Renders rich text from a string with named tags into snippets supplied by the
 * caller. See {@link RichTextProps} for the prop shape.
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
