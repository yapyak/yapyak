import type {
  BalancedSplit,
  Digit,
  NonIdentifierCharacter,
  Trim,
  WhitespaceCharacter,
} from './t-param';

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
      $yapyakTypeError: 'Invalid placeholder "": name cannot be empty.';
    }
  : T extends `${Digit}${string}`
    ? {
        $yapyakTypeError: `Invalid placeholder "${T}": must start with a letter or underscore (not a digit).`;
      }
    : T extends `${string}${NonIdentifierCharacter}${string}`
      ? {
          $yapyakTypeError: `Invalid placeholder "${T}": cannot contain spaces, dots, or other punctuation.`;
        }
      : never;

type ValidateFormat<T extends string> = T extends KnownIcuFormat
  ? never
  : {
      $yapyakTypeError: `Unknown ICU format "${T}". Expected one of: plural, selectordinal, select, number, date, time.`;
    };

type ValidateNumberStyle<TStyle extends string> =
  TStyle extends KnownNumberStyle
    ? never
    : TStyle extends `currency${string}`
      ? never
      : {
          $yapyakTypeError: `Unknown number style "${TStyle}". Expected one of: decimal, percent, currency, integer (or "currency <code>").`;
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
          $yapyakTypeError: `Unknown date style "${TStyle}". Expected one of: short, medium, long, full.`;
        }
    : TFormat extends 'time'
      ? TStyle extends KnownDateTimeStyle
        ? never
        : {
            $yapyakTypeError: `Unknown time style "${TStyle}". Expected one of: short, medium, long, full.`;
          }
      : never;

type IsDigitsOnly<T extends string> = T extends ''
  ? true
  : T extends `${Digit}${infer TRest}`
    ? IsDigitsOnly<TRest>
    : false;

// biome-ignore lint/style/useNamingConvention: yap yap yap
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
          $yapyakTypeError: `Invalid =N literal "${T}": N must be a non-negative integer.`;
        }
      : TFormat extends 'plural'
        ? {
            $yapyakTypeError: `Unknown plural keyword "${T}". Expected one of: zero, one, two, few, many, other, or =N literal.`;
          }
        : {
            $yapyakTypeError: `Unknown selectordinal keyword "${T}". Expected one of: zero, one, two, few, many, other, or =N literal.`;
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
  | `${string}other${WhitespaceCharacter}${string}{${string}`
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
        $yapyakTypeError: `Plural "{${TName}}" is missing the required 'other' branch.`;
      }
  : TFormat extends 'selectordinal'
    ? HasOtherBranch<TBody> extends true
      ? ValidatePluralBranches<TBody, 'selectordinal'>
      : {
          $yapyakTypeError: `Selectordinal "{${TName}}" is missing the required 'other' branch.`;
        }
    : TFormat extends 'select'
      ? HasOtherBranch<TBody> extends true
        ? never
        : {
            $yapyakTypeError: `Select "{${TName}}" is missing the required 'other' branch.`;
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

type FindFirstSourceError<
  T extends string,
  TOriginal extends string = T,
> = T extends `${string}{${infer TInner}`
  ? [
      BalancedSplit<TInner>,
    ] extends [
      never,
    ]
    ? {
        $yapyakTypeError: `Invalid source "${TOriginal}": contains an unclosed '{'. Close it as a placeholder like "{name}" or remove the brace.`;
      }
    : BalancedSplit<TInner> extends [
          infer TBody extends string,
          infer TRest extends string,
        ]
      ? OrElse<
          ValidatePlaceholder<TBody>,
          FindFirstSourceError<TRest, TOriginal>
        >
      : never
  : never;

type ConsumeBalanced<
  T extends string,
  TAcc extends string = '',
> = T extends `${infer TPre}{${infer TAfter}`
  ? [
      BalancedSplit<TAfter>,
    ] extends [
      never,
    ]
    ? `${TAcc}${T}`
    : BalancedSplit<TAfter> extends [
          string,
          infer TRest extends string,
        ]
      ? ConsumeBalanced<TRest, `${TAcc}${TPre}`>
      : `${TAcc}${T}`
  : `${TAcc}${T}`;

type FindStrayCloseError<T extends string, TOriginal extends string = T> =
  ConsumeBalanced<T> extends `${string}}${string}`
    ? {
        $yapyakTypeError: `Invalid source "${TOriginal}": contains an unmatched '}'. Remove it or add a matching '{'.`;
      }
    : never;

type IsTagNameToken<T extends string> = T extends ''
  ? false
  : T extends `${string}${'/' | ' ' | '=' | '<'}${string}`
    ? false
    : true;

type HasAttributedTag<T extends string, TName extends string> = T extends
  | `${string}<${TName} ${string}`
  | `${string}<${TName}/${string}`
  ? true
  : false;

type FindTagError<
  T extends string,
  TStack extends string[] = [],
  TOriginal extends string = T,
> = T extends `${string}<${infer TInner}>${infer TRest}`
  ? TInner extends '' | '/'
    ? {
        $yapyakTypeError: `Invalid source "${TOriginal}": contains an empty tag. Provide a name like "<link>" or remove the brackets.`;
      }
    : TInner extends `/${infer TCloseName}`
      ? IsTagNameToken<TCloseName> extends true
        ? HasAttributedTag<TOriginal, TCloseName> extends true
          ? FindTagError<TRest, TStack, TOriginal>
          : TStack extends [
                infer TTop extends string,
                ...infer TRestStack extends string[],
              ]
            ? TCloseName extends TTop
              ? FindTagError<TRest, TRestStack, TOriginal>
              : {
                  $yapyakTypeError: `Invalid source "${TOriginal}": closing tag "</${TCloseName}>" does not match opening "<${TTop}>". Close the opening tag first.`;
                }
            : {
                $yapyakTypeError: `Invalid source "${TOriginal}": closing tag "</${TCloseName}>" has no matching opening tag.`;
              }
        : FindTagError<TRest, TStack, TOriginal>
      : TInner extends `${string}/`
        ? FindTagError<TRest, TStack, TOriginal>
        : IsTagNameToken<TInner> extends true
          ? FindTagError<
              TRest,
              [
                TInner,
                ...TStack,
              ],
              TOriginal
            >
          : FindTagError<TRest, TStack, TOriginal>
  : TStack extends [
        infer TTop extends string,
        ...string[],
      ]
    ? {
        $yapyakTypeError: `Invalid source "${TOriginal}": opening tag "<${TTop}>" has no closing tag. Add "</${TTop}>".`;
      }
    : never;

export type ValidateSource<T extends string> = string extends T
  ? T
  : T extends ''
    ? {
        $yapyakTypeError: 'Invalid source: must not be an empty string.';
      }
    : OrElse<
        FindFirstSourceError<T>,
        OrElse<FindStrayCloseError<T>, OrElse<FindTagError<T>, T>>
      >;
