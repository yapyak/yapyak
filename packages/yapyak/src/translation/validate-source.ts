import type { Digit, NonIdentifierChar, Trim } from './t-param';
import type {
  EmptySourceError,
  InvalidPlaceholderError,
  MissingOtherBranchError,
  UnknownIcuFormatError,
} from './type-error';

type OrElse<TValue, TFallback> = [TValue] extends [never] ? TFallback : TValue;

type KnownIcuFormat =
  | 'date'
  | 'number'
  | 'plural'
  | 'select'
  | 'selectordinal'
  | 'time';

type ValidateName<T extends string> = T extends ''
  ? InvalidPlaceholderError<'', 'name cannot be empty'>
  : T extends `${Digit}${string}`
    ? InvalidPlaceholderError<
        T,
        'must start with a letter or underscore (not a digit)'
      >
    : T extends `${string}${NonIdentifierChar}${string}`
      ? InvalidPlaceholderError<
          T,
          'cannot contain spaces, dots, or other punctuation'
        >
      : never;

type ValidateFormat<T extends string> = T extends KnownIcuFormat
  ? never
  : UnknownIcuFormatError<T>;

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
    : MissingOtherBranchError<TName, 'Plural'>
  : TFormat extends 'selectordinal'
    ? HasOtherBranch<TBody> extends true
      ? never
      : MissingOtherBranchError<TName, 'Selectordinal'>
    : TFormat extends 'select'
      ? HasOtherBranch<TBody> extends true
        ? never
        : MissingOtherBranchError<TName, 'Select'>
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
    ? EmptySourceError
    : OrElse<FindFirstSourceError<T>, T>;
