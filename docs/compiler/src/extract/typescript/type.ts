import type { ExportKind } from '../../access';

export type ReferenceManifest = {
  modules: ReferenceModule[];
  packageName: string;
};

export type ReferenceModule = {
  description: string;
  exports: ReferenceExport[];
  id: string;
  sourcePath: string;
  subpath: string;
};

export type ReferenceExport =
  | ReferenceClassSymbol
  | ReferenceFunction
  | ReferenceInterfaceSymbol
  | ReferenceTypeAlias
  | ReferenceVariable;

type ReferenceSymbolBase = {
  deprecated: string | null;
  description: string;
  examples: ReferenceExample[];
  location: ReferenceLocation;
  name: string;
  remarks: string;
  seeAlso: string[];
  shape: string;
  tags: ReferenceTag[];
  throws: ReferenceThrows[];
};

export type ReferenceExportBase = ReferenceSymbolBase & {
  displayKind: ExportKind;
};

export type ReferenceExample = {
  code: string;
  language: string;
  path: string | null;
  title: string | null;
};

export type ReferenceThrows = {
  condition: string;
  errorClass: string;
};

type ReferenceFunction = ReferenceExportBase & {
  kind: 'function';
  members: ReferenceMember[];
  overloads: ReferenceOverload[];
};

export type ReferenceOverload = {
  parameters: ReferenceParameter[];
  returnType: TypeToken[];
  signature: string;
  typeParameters: ReferenceTypeParameter[];
};

export type ReferenceTypeParameter = {
  constraint: TypeToken[] | null;
  defaultType: TypeToken[] | null;
  description: string;
  name: string;
};

type ReferenceInterfaceSymbol = ReferenceExportBase & {
  callSignatures: ReferenceCallSignature[];
  kind: 'interface';
  members: ReferenceMember[];
  signature: string;
};

export type ReferenceTypeAlias = ReferenceExportBase & {
  callSignatures: ReferenceCallSignature[];
  kind: 'type';
  members: ReferenceMember[];
  resolvedType: TypeToken[];
  signature: string;
};

export type ReferenceVariable = ReferenceExportBase & {
  kind: 'variable';
  members: ReferenceMember[];
  type: TypeToken[];
};

type ReferenceClassSymbol = ReferenceExportBase & {
  kind: 'class';
  members: ReferenceMember[];
  signature: string;
};

export type ReferenceParameter = {
  defaultValue: string | null;
  description: string;
  name: string;
  optional: boolean;
  shape: string;
  type: TypeToken[];
};

export type ReferenceMember = ReferencePropertyMember | ReferenceMethodMember;

export type ReferencePropertyMember = {
  defaultValue: string | null;
  description: string;
  kind: 'property';
  name: string;
  optional: boolean;
  type: TypeToken[];
};

export type ReferenceMethodMember = ReferenceSymbolBase & {
  kind: 'method';
  optional: boolean;
  overloads: ReferenceOverload[];
};

export type ReferenceCallSignature = {
  parameters: ReferenceParameter[];
  returnType: TypeToken[];
  signature: string;
  typeParameters: ReferenceTypeParameter[];
};

export type TypeToken = TypeRefToken | TypeTextToken;

type TypeTextToken = {
  kind: 'text';
  text: string;
};

type TypeRefToken = {
  kind: 'ref';
  module: string;
  name: string;
  text: string;
};

export type ReferenceLocation = {
  column: number;
  file: string;
  line: number;
};

export type ReferenceTag = {
  name: string;
  text: string;
};
