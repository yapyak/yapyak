export type MarkdocAttributeValue =
  | MarkdocAttributeValue[]
  | { [key: string]: MarkdocAttributeValue }
  | boolean
  | number
  | string
  | null;

export interface MarkdocTag {
  $$mdtype: 'Tag';
  attributes: Record<string, MarkdocAttributeValue>;
  children: MarkdocNode[];
  name: string;
}

export type MarkdocNode = MarkdocTag | boolean | number | string | null;
