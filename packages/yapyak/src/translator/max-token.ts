export type ResolveMaxTokensInput = {
  cap: number;
  floor: number;
  itemCount: number;
  localeCount: number;
  override: number | undefined;
  perItem: number;
};

export function resolveMaxTokens(input: ResolveMaxTokensInput): number {
  if (input.override !== undefined) {
    if (!Number.isFinite(input.override) || input.override <= 0) {
      throw new Error(
        `resolveMaxTokens: maxTokens override must be a positive finite number, got ${String(input.override)}.`,
      );
    }
    return input.override;
  }
  const projected = input.itemCount * input.localeCount * input.perItem;
  return Math.min(input.cap, Math.max(input.floor, projected));
}
