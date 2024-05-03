import Directive, { IDescriptor } from './directive'
import { getAttr, getBindAttr } from './utils'
type IDesItem = IDescriptor
const des: IDesItem[] = []
// 当前是否在解析指令
let pending = false

export function compile(vm: any, el: Node) {
  // 如果当前节点不是v-for指令，则继续解析子节点
  if (!compileNode(el, vm)) {
    if (el.hasChildNodes()) {
      compileNodeList(el.childNodes, vm)
    }
  }

  if (!pending) {
    let dir
    let descriptor: IDesItem | undefined
    pending = true
    sortDescriptors(des)
    while (des.length) {
      descriptor = des.shift() as IDesItem
      dir = new Directive(descriptor, descriptor.vm)

      dir._bind()
      descriptor.vm._directives.push(dir)
    }
    pending = false
    vm._callHook('compiled')
    setTimeout(() => {
      teardown(vm)
      vm._callHook('destroyed')
    }, 0)
  }
}

export function compileProps(vm: any, el: Element, propsOptions: any) {
  const { directives } = vm.$options
  const props: any = []
  let prop: any
  let value
  let name
  const keys = Object.keys(propsOptions)
  keys.forEach((key) => {
    name = propsOptions[key]
    prop = {
      name,
      path: name
    }
    if ((value = getBindAttr(el, name) !== null)) {
      // 动态绑定的属性
      prop.dynamic = true
      prop.raw = prop.parentPath = value
    } else if ((value = getAttr(el, name)) !== null) {
      prop.raw = value
    }
    props.push(prop)
  })
  vm._props = {}

  props.forEach((prop: any) => {
    let { path, raw, options } = prop
    vm._props[path] = prop
    // 动态绑定的属性
    if (prop.dynamic) {
      if (vm._context) {
        // 如果props是动态属性，则吧更新函数推入到des队列中
        des.push({
          vm,
          name: 'prop',
          def: directives.prop,
          prop
        })
      }
    } else {
      defineReactive(vm, prop.path, prop.raw)
    }
  })
}

function sortDescriptors(des: IDesItem[]) {
  des.forEach((d) => {
    if (!d.def.priority) {
      d.def.priority = 1000
    }
  })

  des.sort((a, b) => {
    return b.def.priority! - a.def.priority!
  })
}
/** 判断是否是for循环的节点； 2.对元素的指令进行处理 */
function compileNode(node: Element, vm: any) {
  const type = node.nodeType
  if (type === 1) {
    // 自定义组件 | 浏览器原生dom
    return compileElement(node, vm)
  } else if (type === 3) {
    // 处理文本
    return compileTextNode(node as any as Text, vm)
  }
}

function compileTextNode(node: Text, vm: any) {
  const tokens: { value: string; tag?: boolean; descriptor?: any }[] =
    parseText(node.nodeValue, vm)
  if (!tokens) return
  const frag = document.createDocumentFragment()
  let el
  tokens.forEach((token) => {
    el = token.tag
      ? processTextToken(token, vm)
      : document.createTextNode(token.value)
    frag.appendChild(el!)

    if (token.tag) {
      des.push(token.descriptor)
    }
  })

  Promise.resolve().then(() => {
    replace(node, frag)
  })
}

const commonTagRE = /^(div|p|span|img|a|b|i|br|ul|ol|li|h1|h2|h3)$/g
const reservedTagRE = /^(slot|partial|component)$/i
const onRe = /^(v-on:|@)/
const bindRe = /^(v-bind:|:)/
const dirAttrRE = /^v-([^:]+)(?:$|:(.*)$)/

function compileElement(node: Element, vm: any) {
  const directives = vm.$options.directives
  const tag = node.tagName.toLowerCase()

  // 如果不是常规标签，代表是组件
  if (!commonTagRE.test(tag) && !reservedTagRE.test(tag)) {
    if (vm.$options.components[tag]) {
      des.push({
        vm,
        el: node,
        name: 'component',
        expression: tag,
        def: directives.component,
        modifiers: {
          literal: true
        }
      })
    }
  } else if (tag === 'slot') {
    des.push({
      vm,
      el: node,
      arg: undefined,
      name: 'slot',
      attr: undefined,
      expression: '',
      def: directives.slot
    })
  } else if (node.hasAttributes()) {
    let matched
    let isFor = false
    const attrs = toArray(node.attributes)
    attrs.forEach((attr: Attr) => {
      const name = attr.name.trim()
      const value = attr.value.trim()

      // 事件
      if (onRe.test(name)) {
        node.removeAttribute(name)
        des.push({
          vm,
          el: node,
          arg: name.replace(onRe, ''),
          name: 'on',
          attr: name,
          expression: value,
          def: directives.on
        })
      } else if (bindRe.test(name)) {
        // 动态属性
        const values = value.split('|')
        const temp: any = {
          vm,
          el: node,
          arg: name.replace(bindRe, ''),
          name: 'bind',
          attr: name,
          def: directives.bind
        }
        if (values.length > 1) {
          const expression = values.shift()
          const filters: any = []
          values.forEach((value) => {
            filters.push({
              name: value.trim()
            })
          })
          temp.expression = expression
          temp.filters = filters
        }
        des.push(temp)
      } else if ((matched = name.match(dirAttrRE))) {
        if (name == 'v-text') {
        }
      }
    })
    return isFor
  }
}
function processTextToken(
  token: { value: string; tag?: boolean; descriptor?: IDesItem },
  vm: any
): Text | null {
  const { directives } = vm.$options
  const el = document.createTextNode(' ')
  if (token.descriptor) return null
  const values = token.value.split('|')
  token.descriptor = {
    vm,
    el,
    name: 'text',
    def: directives.text
  }

  if (values.length > 1) {
    const value = values.shift()
    const filters: any = []

    values.forEach((value) => {
      filters.push({
        name: value.trim()
      })
    })

    token.descriptor.expression = value?.trim()
    token.descriptor.filters = filters
  } else {
    token.descriptor.expression = token.value.trim()
  }

  return el
}

function compileNodeList(nodes: any[], vm: any) {
  nodes.forEach((node: any) => {
    if (!compileNode(node, vm)) {
      if (node.hasChildNodes()) {
        compileNodeList(node.childNodes, vm)
      }
    }
  })
}
