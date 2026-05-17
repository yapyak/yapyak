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
  parameters: ApiParameter[];
  returnDescription: string;
  returnType: string;
  signature: string;
}

export interface ApiInterface extends ApiSymbolBase {
  callSignatures: ApiCallSignature[];
  kind: 'interface';
  members: ApiMember[];
  signature: string;
}

export interface ApiTypeAlias extends ApiSymbolBase {
  kind: 'type';
  resolvedType: string;
  signature: string;
}

export interface ApiVariable extends ApiSymbolBase {
  kind: 'variable';
  signature: string;
  type: string;
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
  type: string;
}

export interface ApiMember {
  defaultValue: string | null;
  description: string;
  name: string;
  optional: boolean;
  type: string;
}

export interface ApiCallSignature {
  parameters: ApiParameter[];
  returnType: string;
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

export interface ReferenceSidebar {
  modules: RefModule[];
}

export interface RefModule {
  href: string;
  id: string;
  submodules: RefModule[];
  symbols: RefSymbol[];
}

export interface RefSymbol {
  href: string;
  isDeprecated: boolean;
  kind: ApiExport['kind'];
  name: string;
}
