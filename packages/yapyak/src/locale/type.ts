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
 * The locale. Holds a BCP 47 language tag.
 *
 * @shape 'en' | 'sv' | ...
 *
 * @see [BCP 47](https://datatracker.ietf.org/doc/html/bcp47)
 */
export type Locale = Register extends {
  // biome-ignore lint/style/useNamingConvention: yap yap yap
  Locale: infer L extends string;
}
  ? L
  : string;
