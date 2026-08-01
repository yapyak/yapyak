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
