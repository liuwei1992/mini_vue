export function query(el: string | Element) {
  return typeof el === 'string' ? document.querySelector(el) : el
}

export function getBindAttr(node: Element, name: any) {
  let val = getAttr(node, ':' + name)
  if (val === null) {
    val = getAttr(node, 'v-bind:' + name)
  }
  return val
}

export function getAttr(node: Element, _attr: string) {
  const val = node.getAttribute(_attr)
  if (val !== null) {
    node.removeAttribute(_attr)
  }
  return val
}
