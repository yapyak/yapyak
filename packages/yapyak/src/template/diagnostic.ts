export type TemplateDiagnostic =
  | { message: string; reason: 'malformed' }
  | { name: string; reason: 'missing-other' }
  | { feature: string; name: string; reason: 'unsupported' };
