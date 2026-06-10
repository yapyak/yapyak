import type { Digit, NonIdentifierChar, Trim } from './t-param';

type OrElse<TValue, TFallback> = [
  TValue,
] extends [
  never,
]
  ? TFallback
  : TValue;

type KnownIcuFormat =
  | 'date'
  | 'number'
  | 'plural'
  | 'select'
  | 'selectordinal'
  | 'time';

type KnownNumberStyle = 'currency' | 'decimal' | 'integer' | 'percent';

type KnownDateTimeStyle = 'full' | 'long' | 'medium' | 'short';

type KnownPluralKeyword = 'few' | 'many' | 'one' | 'other' | 'two' | 'zero';

type ValidateName<T extends string> = T extends ''
  ? {
      $yapyakTypeError: 'Invalid placeholder "": name cannot be empty';
    }
  : T extends `${Digit}${string}`
    ? {
        $yapyakTypeError: `Invalid placeholder "${T}": must start with a letter or underscore (not a digit)`;
      }
    : T extends `${string}${NonIdentifierChar}${string}`
      ? {
          $yapyakTypeError: `Invalid placeholder "${T}": cannot contain spaces, dots, or other punctuation`;
        }
      : never;

type ValidateFormat<T extends string> = T extends KnownIcuFormat
  ? never
  : {
      $yapyakTypeError: `Unknown ICU format "${T}" — expected one of: plural, selectordinal, select, number, date, time`;
    };

type ValidateNumberStyle<TStyle extends string> =
  TStyle extends KnownNumberStyle
    ? never
    : TStyle extends `currency${string}`
      ? never
      : {
          $yapyakTypeError: `Unknown number style "${TStyle}" — expected one of: decimal, percent, currency, integer (or "currency <code>")`;
        };

type ValidateStyle<
  TFormat extends string,
  TStyle extends string,
> = TFormat extends 'number'
  ? ValidateNumberStyle<TStyle>
  : TFormat extends 'date'
    ? TStyle extends KnownDateTimeStyle
      ? never
      : {
          $yapyakTypeError: `Unknown date style "${TStyle}" — expected one of: short, medium, long, full`;
        }
    : TFormat extends 'time'
      ? TStyle extends KnownDateTimeStyle
        ? never
        : {
            $yapyakTypeError: `Unknown time style "${TStyle}" — expected one of: short, medium, long, full`;
          }
      : never;

type IsDigitsOnly<T extends string> = T extends ''
  ? true
  : T extends `${Digit}${infer TRest}`
    ? IsDigitsOnly<TRest>
    : false;

type IsValidEqualLiteral<T extends string> = T extends `=${infer TN}`
  ? TN extends ''
    ? false
    : IsDigitsOnly<TN>
  : false;

type ValidatePluralKeyword<
  T extends string,
  TFormat extends string,
> = T extends KnownPluralKeyword
  ? never
  : IsValidEqualLiteral<T> extends true
    ? never
    : T extends `=${string}`
      ? {
          $yapyakTypeError: `Invalid =N literal "${T}": N must be a non-negative integer`;
        }
      : TFormat extends 'plural'
        ? {
            $yapyakTypeError: `Unknown plural keyword "${T}" — expected one of: zero, one, two, few, many, other, or =N literal`;
          }
        : {
            $yapyakTypeError: `Unknown selectordinal keyword "${T}" — expected one of: zero, one, two, few, many, other, or =N literal`;
          };

type AllBranchesParseable<T extends string> =
  Trim<T> extends ''
    ? true
    : Trim<T> extends `${string} {${infer TContent}}${infer TRest}`
      ? TContent extends `${string}{${string}`
        ? false
        : AllBranchesParseable<TRest>
      : false;

type ValidatePluralBranchesInner<TBody extends string, TFormat extends string> =
  Trim<TBody> extends ''
    ? never
    : Trim<TBody> extends `${infer TKeyword} {${string}}${infer TRest}`
      ? OrElse<
          ValidatePluralKeyword<Trim<TKeyword>, TFormat>,
          ValidatePluralBranchesInner<TRest, TFormat>
        >
      : never;

type ValidatePluralBranches<TBody extends string, TFormat extends string> =
  AllBranchesParseable<TBody> extends true
    ? ValidatePluralBranchesInner<TBody, TFormat>
    : never;

type HasOtherBranch<T extends string> = T extends
  | `${string}other ${string}{${string}`
  | `${string}other{${string}`
  ? true
  : false;

type ValidateBranches<
  TName extends string,
  TFormat extends string,
  TBody extends string,
> = TFormat extends 'plural'
  ? HasOtherBranch<TBody> extends true
    ? ValidatePluralBranches<TBody, 'plural'>
    : {
        $yapyakTypeError: `Plural "{${TName}}" is missing the required 'other' branch`;
      }
  : TFormat extends 'selectordinal'
    ? HasOtherBranch<TBody> extends true
      ? ValidatePluralBranches<TBody, 'selectordinal'>
      : {
          $yapyakTypeError: `Selectordinal "{${TName}}" is missing the required 'other' branch`;
        }
    : TFormat extends 'select'
      ? HasOtherBranch<TBody> extends true
        ? never
        : {
            $yapyakTypeError: `Select "{${TName}}" is missing the required 'other' branch`;
          }
      : TFormat extends 'date' | 'number' | 'time'
        ? ValidateStyle<TFormat, Trim<TBody>>
        : never;

type ValidatePlaceholder<T extends string> =
  T extends `${infer TName},${infer TFormat},${infer TBody}`
    ? OrElse<
        ValidateName<Trim<TName>>,
        OrElse<
          ValidateFormat<Trim<TFormat>>,
          ValidateBranches<Trim<TName>, Trim<TFormat>, TBody>
        >
      >
    : T extends `${infer TName},${infer TFormat}`
      ? OrElse<ValidateName<Trim<TName>>, ValidateFormat<Trim<TFormat>>>
      : ValidateName<Trim<T>>;

type FindFirstSourceError<T extends string> =
  T extends `${string}{${infer TName},${infer TFormat},${infer TBody}}}${infer TRest}`
    ? OrElse<
        ValidatePlaceholder<`${TName},${TFormat},${TBody}}`>,
        FindFirstSourceError<TRest>
      >
    : T extends `${string}{${infer TName},${infer TFormat},${infer TBody}}${infer TRest}`
      ? OrElse<
          ValidatePlaceholder<`${TName},${TFormat},${TBody}`>,
          FindFirstSourceError<TRest>
        >
      : T extends `${string}{${infer TContent}}${infer TRest}`
        ? OrElse<ValidatePlaceholder<TContent>, FindFirstSourceError<TRest>>
        : never;

export type ValidateSource<T extends string> = string extends T
  ? T
  : T extends ''
    ? {
        $yapyakTypeError: 'Invalid source: must not be an empty string';
      }
    : OrElse<FindFirstSourceError<T>, T>;
