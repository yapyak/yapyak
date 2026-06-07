import type { Digit, NonIdentifierChar, Trim } from './t-param';

type OrElse<TValue, TFallback> = [TValue] extends [never] ? TFallback : TValue;

type KnownIcuFormat =
  | 'date'
  | 'number'
  | 'plural'
  | 'select'
  | 'selectordinal'
  | 'time';

type ValidateName<T extends string> = T extends ''
  ? { $yapyakTypeError: 'Invalid placeholder "": name cannot be empty' }
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
    ? never
    : {
        $yapyakTypeError: `Plural "{${TName}}" is missing the required 'other' branch`;
      }
  : TFormat extends 'selectordinal'
    ? HasOtherBranch<TBody> extends true
      ? never
      : {
          $yapyakTypeError: `Selectordinal "{${TName}}" is missing the required 'other' branch`;
        }
    : TFormat extends 'select'
      ? HasOtherBranch<TBody> extends true
        ? never
        : {
            $yapyakTypeError: `Select "{${TName}}" is missing the required 'other' branch`;
          }
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
    ? { $yapyakTypeError: 'Invalid source: must not be an empty string' }
    : OrElse<FindFirstSourceError<T>, T>;
