export function isElementNode(node: HTMLElement) {
  return node.nodeType === 1;
}

export function isTextNode(node: HTMLElement) {
  return node.nodeType === 3;
}

export function hasChildNodes(node: HTMLElement) {
  return node.childNodes && node.childNodes.length;
}

export function isDirective(attrName: string) {
  return ['d-', '@', ':'].some(
    (prefix) => attrName.startsWith(prefix)
  );
}