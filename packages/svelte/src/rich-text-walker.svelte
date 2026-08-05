<script lang="ts">
  import type { Snippet } from "svelte";
  import type { RichTextNode } from "yapyak";

  import type { PairFn, VoidFn } from "./rich-text";
  import RichTextWalker from "./rich-text-walker.svelte";

  let {
    handlers,
    nodes,
  }: {
    handlers: Record<string, PairFn | VoidFn>;
    nodes: RichTextNode[];
  } = $props();
</script>

{#each nodes as node, index (index)}
  {#if node.type === "text"}
    {node.value}
  {:else if node.type === "void"}
    {#if handlers[node.name]}
      {@render (handlers[node.name] as VoidFn)()}
    {:else}
      {`<${node.name}/>`}
    {/if}
  {:else if handlers[node.name]}
    {@const handler = handlers[node.name] as PairFn}
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
