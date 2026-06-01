<script lang="ts" generics="T extends string">
  import type { RichTextProps } from "./rich-text";

  import { parseRichTextTree } from "yapyak/internal";

  import RichTextWalker from "./rich-text-walker.svelte";

  const { value, ...handlers }: RichTextProps<T> = $props();

  const nodes = $derived(parseRichTextTree(value));
</script>

<RichTextWalker {handlers} {nodes} />
