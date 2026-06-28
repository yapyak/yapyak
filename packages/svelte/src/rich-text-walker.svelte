<script lang="ts">
  import type { Snippet } from "svelte";
  import type { RichTextNode } from "yapyak";

  import type { PairHandler, VoidHandler } from "./rich-text";
  import RichTextWalker from "./rich-text-walker.svelte";

  let {
    handlers,
    nodes,
  }: {
    handlers: Record<string, PairHandler | VoidHandler>;
    nodes: RichTextNode[];
  } = $props();
</script>

{#each nodes as node, index (index)}
  {#if node.type === "text"}
    {node.value}
  {:else if node.type === "void"}
    {#if handlers[node.name]}
      {@render (handlers[node.name] as VoidHandler)()}
    {:else}
      {`<${node.name}/>`}
    {/if}
  {:else if handlers[node.name]}
    {@const handler = handlers[node.name] as PairHandler}
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
