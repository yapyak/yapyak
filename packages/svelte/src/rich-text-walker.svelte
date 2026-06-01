<script lang="ts">
  import type { RichTextNode } from "yapyak/internal";

  import type { TagHandler } from "./rich-text.svelte";
  import RichTextWalker from "./rich-text-walker.svelte";

  interface RichTextWalkerProps {
    handlers: Record<string, TagHandler>;
    nodes: RichTextNode[];
  }

  const { handlers, nodes }: RichTextWalkerProps = $props();
</script>

{#each nodes as node}
  {#if node.type === "text"}
    {node.text}
  {:else if handlers[node.name]}
    {@const handler = handlers[node.name]}
    {#snippet children()}
      <RichTextWalker {handlers} nodes={node.children} />
    {/snippet}
    {@render handler?.(children)}
  {:else}
    {`<${node.name}>`}<RichTextWalker
      {handlers}
      nodes={node.children}
    />{`</${node.name}>`}
  {/if}
{/each}
