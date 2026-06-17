// biome-ignore lint/style/useConsistentTypeDefinitions: yap yap yap
interface ImportMeta {
  readonly env?: {
    readonly DEV?: boolean;
  };
  readonly hot?: {
    accept?(callback?: () => void): void;
    dispose(callback: () => void): void;
    on?<T>(event: string, callback: (data: T) => void): void;
  };
}

declare function $state<T>(initial: T): T;
declare function $derived<T>(expr: T): T;
declare function $effect(fn: () => undefined | (() => void)): void;

declare module '*.svelte' {
  import type { Component } from 'svelte';

  const component: Component<Record<string, unknown>>;
  export default component;
}
