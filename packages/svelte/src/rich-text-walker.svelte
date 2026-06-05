<script lang="ts">
  import type { Snippet } from "svelte";
  import type { RichTextNode } from "yapyak/internal";

  import type { TagHandler } from "./rich-text";
  import RichTextWalker from "./rich-text-walker.svelte";

  let {
    handlers,
    nodes,
  }: { handlers: Record<string, TagHandler>; nodes: RichTextNode[] } = $props();
</script>

{#each nodes as node, index (index)}
  {#if node.type === "text"}
    {node.text}
  {:else if handlers[node.name]}
    {@const handler = handlers[node.name]}
    {#snippet children()}
      <RichTextWalker {handlers} nodes={node.children} />
    {/snippet}
    {@render handler?.(children as Snippet)}
  {:else}
    {`<${node.name}>`}<RichTextWalker
      {handlers}
      nodes={node.children}
    />{`</${node.name}>`}
  {/if}
{/each}
