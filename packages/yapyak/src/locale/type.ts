/**
 * The register. Declares augmentation slots for locale-related types.
 *
 * @remarks
 * Module augmentation of this interface narrows {@link Locale} from `string` to a literal union.
 *
 * @example
 * ```ts
 * declare module 'yapyak' {
 *   interface Register {
 *     Locale: 'en' | 'sv' | 'da';
 *   }
 * }
 * ```
 */
// biome-ignore lint/style/useConsistentTypeDefinitions: yap yap yap
// biome-ignore lint/suspicious/noEmptyInterface: yap yap yap
export interface Register {}

/**
 * The locale. Narrows to `Register['Locale']` when augmented; falls back to `string`.
 *
 * @shape 'en' | 'sv' | ...
 */
export type Locale = Register extends {
  // biome-ignore lint/style/useNamingConvention: yap yap yap
  Locale: infer L extends string;
}
  ? L
  : string;
