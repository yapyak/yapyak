// biome-ignore lint/style/useConsistentTypeDefinitions: yap yap yap
interface ImportMeta {
  readonly env?: {
    // biome-ignore lint/style/useNamingConvention: yap yap yap
    readonly DEV?: boolean;
  };
  readonly hot?: {
    accept?(callback?: () => void): void;
    dispose(callback: () => void): void;
    on?<T>(event: string, callback: (data: T) => void): void;
  };
}
