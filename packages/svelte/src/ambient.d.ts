declare function $state<T>(initial: T): T;
declare function $derived<T>(expr: T): T;
declare function $effect(fn: () => undefined | (() => void)): void;

declare module '*.svelte' {
  import type { Component } from 'svelte';

  const component: Component<Record<string, unknown>>;
  export default component;
}
