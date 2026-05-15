declare function $state<T>(initial: T): T;
declare function $derived<T>(expr: T): T;
declare function $effect(fn: () => undefined | (() => void)): void;
