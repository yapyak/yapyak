/**
 * The token emitted by {@link Children} inside a {@link RichText} named slot and replaced by the rendered children of the matched tag.
 *
 * @remarks
 * The token is a fixed sentinel string with a random suffix so it cannot collide with translator-produced text or hand-written slot content. Astro's renderer treats the token as opaque text and passes it through unchanged.
 */
export const CHILDREN_TOKEN = '__YAPYAK_CHILDREN_b3jvtm6yqx__';
