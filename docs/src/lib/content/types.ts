export type AttributeValue =
  | AttributeValue[]
  | { [key: string]: AttributeValue }
  | boolean
  | number
  | string
  | null;

export interface Block {
  attributes: Record<string, AttributeValue>;
  children: Block[];
  type: string;
  value: string;
}

export interface Page {
  blocks: Block[];
  description: string;
  title: string;
}
