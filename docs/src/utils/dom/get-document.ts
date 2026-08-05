export function getDocument(node?: Node) {
  return node?.ownerDocument ?? document;
}
