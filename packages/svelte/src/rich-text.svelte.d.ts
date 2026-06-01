import type { Component } from 'svelte';
import type { RichTextProps } from './rich-text';

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
declare const RichText: Component<RichTextProps<string>>;
export default RichText;
