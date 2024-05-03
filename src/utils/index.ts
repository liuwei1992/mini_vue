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

export function replace(node: Node, node2: Node) {
  node.parentNode?.replaceChild(node, node2)
}

export function on(
  el: Node,
  event: string,
  cb: EventListenerOrEventListenerObject | null,
  useCapture?: AddEventListenerOptions | boolean
) {
  el.addEventListener(event, cb, useCapture)
}

export function off(
  el: Node,
  event: string,
  cb: EventListenerOrEventListenerObject | null
) {
  el.removeEventListener(event, cb)
}

export function bind(fn: Function, ctx: any) {
  return function (a: any) {
    let l = arguments.length
    return l
      ? l > 1
        ? fn.apply(ctx, arguments)
        : fn.call(ctx, a)
      : fn.call(ctx)
  }
}

export function def(obj: any, key: string, val: any, enumerable: boolean) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    configurable: true
  })
}

export function remove(node: Node | Element) {
  node.parentNode?.removeChild(node)
}

export function extend(a: any, b: any) {
  return Object.assign(b, a)
}

export function insert(newNode: Node, oldNode: Node) {
  oldNode.parentNode?.insertBefore(newNode, oldNode)
}

export function addClass(el: Element, cls: string) {
  el.classList.add(cls)
}
