<script lang="ts" generics="T extends string">
  import type { RichTextProps } from "./rich-text.svelte";

  import { parseRichText } from "yapyak/internal";

  import RichTextWalker from "./rich-text-walker.svelte";

  const { value, ...handlers }: RichTextProps<T> = $props();

  const nodes = $derived(parseRichText(value));
</script>

<RichTextWalker {handlers} {nodes} />
