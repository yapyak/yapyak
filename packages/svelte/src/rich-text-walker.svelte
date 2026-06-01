<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { RichTextNode } from 'yapyak/internal';

  import RichTextWalker from './rich-text-walker.svelte';

  type Handler = Snippet<[Snippet]>;

  let {
    handlers,
    nodes,
  }: { handlers: Record<string, Handler>; nodes: RichTextNode[] } = $props();
</script>

{#each nodes as node, index (index)}
  {#if node.type === 'text'}
    {node.text}
  {:else if handlers[node.name]}
    {@const handler = handlers[node.name]}
    {#snippet children()}
      <RichTextWalker
        {handlers}
        nodes={node.children}
      />
    {/snippet}
    {@render handler?.(children)}
  {:else}
    {`<${node.name}>`}<RichTextWalker
      {handlers}
      nodes={node.children}
    />{`</${node.name}>`}
  {/if}
{/each}
