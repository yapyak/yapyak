export function getDocument(node?: Node): Document {
  return node?.ownerDocument ?? document;
}
