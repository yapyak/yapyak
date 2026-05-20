export interface ApiManifest {
  modules: ApiModule[];
}

export interface ApiModule {
  exports: ApiExport[];
  id: string;
  sourcePath: string;
  subpath: string;
}

export type ApiExport =
  | ApiFunction
  | ApiInterface
  | ApiTypeAlias
  | ApiVariable
  | ApiClass;

export interface ApiSymbolBase {
  deprecated: string | null;
  description: string;
  examples: string[];
  location: ApiLocation;
  name: string;
  tags: ApiTag[];
}

export interface ApiFunction extends ApiSymbolBase {
  kind: 'function';
  members: ApiMember[];
  overloads: ApiOverload[];
  returnDescription: string;
}

export interface ApiOverload {
  parameters: ApiParameter[];
  returnType: TypeToken[];
  signature: string;
  typeParameters: ApiTypeParameter[];
}

export interface ApiTypeParameter {
  constraint: TypeToken[] | null;
  defaultType: TypeToken[] | null;
  name: string;
}

export interface ApiInterface extends ApiSymbolBase {
  callSignatures: ApiCallSignature[];
  kind: 'interface';
  members: ApiMember[];
  signature: string;
}

export interface ApiTypeAlias extends ApiSymbolBase {
  kind: 'type';
  resolvedType: TypeToken[];
  signature: string;
}

export interface ApiVariable extends ApiSymbolBase {
  kind: 'variable';
  members: ApiMember[];
  signature: string;
  type: TypeToken[];
}

export interface ApiClass extends ApiSymbolBase {
  kind: 'class';
  members: ApiMember[];
  signature: string;
}

export interface ApiParameter {
  defaultValue: string | null;
  description: string;
  name: string;
  optional: boolean;
  type: TypeToken[];
}

export interface ApiMember {
  defaultValue: string | null;
  description: string;
  name: string;
  optional: boolean;
  type: TypeToken[];
}

export interface ApiCallSignature {
  parameters: ApiParameter[];
  returnType: TypeToken[];
  signature: string;
  typeParameters: ApiTypeParameter[];
}

export type TypeToken = TypeTextToken | TypeRefToken;

export interface TypeTextToken {
  kind: 'text';
  text: string;
}

export interface TypeRefToken {
  kind: 'ref';
  module: string;
  name: string;
  text: string;
}

export interface ApiLocation {
  column: number;
  file: string;
  line: number;
}

export interface ApiTag {
  name: string;
  text: string;
}

