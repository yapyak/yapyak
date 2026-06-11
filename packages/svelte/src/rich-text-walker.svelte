<script lang="ts">
  import type { Snippet } from "svelte";
  import type { RichTextNode } from "yapyak/internal";

  import type { TagHandler, VoidHandler } from "./rich-text";
  import RichTextWalker from "./rich-text-walker.svelte";

  let {
    handlers,
    nodes,
  }: {
    handlers: Record<string, TagHandler | VoidHandler>;
    nodes: RichTextNode[];
  } = $props();
</script>

{#each nodes as node, index (index)}
  {#if node.type === "text"}
    {node.text}
  {:else if node.type === "void"}
    {#if handlers[node.name]}
      {@render (handlers[node.name] as VoidHandler)()}
    {:else}
      {`<${node.name}/>`}
    {/if}
  {:else if handlers[node.name]}
    {@const handler = handlers[node.name] as TagHandler}
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
