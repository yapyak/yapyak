<script lang="ts" generics="T extends string">
  import type { RichTextProps } from "./rich-text";

  import { parseRichText } from "yapyak";

  import RichTextWalker from "./rich-text-walker.svelte";

  const { value, ...handlers }: RichTextProps<T> = $props();

  const nodes = $derived(parseRichText(value));
</script>

<RichTextWalker {handlers} {nodes} />
