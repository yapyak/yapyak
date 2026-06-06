export type ContextSeparatorError<T extends string> =
  `Invalid context "${T}": '@' is reserved as the source/context separator`;

export type EmptySourceError = 'Invalid source: must not be an empty string';

export type InvalidPlaceholderError<
  TName extends string,
  TReason extends string,
> = `Invalid placeholder "${TName}": ${TReason}`;

export type UnknownIcuFormatError<T extends string> =
  `Unknown ICU format "${T}" — expected one of: plural, selectordinal, select, number, date, time`;

export type MissingOtherBranchError<
  TName extends string,
  TKind extends string,
> = `${TKind} "{${TName}}" is missing the required 'other' branch`;
