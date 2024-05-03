import { compile } from './compile'
import Directive from './directive'
import { getAttr, insert, off, on, remove, replace } from './utils'

const ON = 700
const MODEL = 800
const BIND = 850
const COMPONENT = 1500
const IF = 2100
const FOR = 2200
const SLOT = 2300

const handles = {
  text: {
    bind(this: any) {
      const self = this
      this.listener = function () {
        self.set(this.value)
      }
      on(this.el, 'input', this.listener)
    },
    update(this: any, value: any) {
      this.el.value = value
    },
    unbind(this: any) {
      off(this.el, 'input', this.listener)
    }
  },
  select: {
    bind() {},
    update() {}
  },
  radio: {
    bind() {},
    update() {}
  },
  checkbox: {
    bind() {}
  }
}

// 针对各种指令的回调函数
const directives = {
  // {text}
  text: {
    bind(this: any) {
      this.attr = this.el.nodeType === 3 ? 'data' : 'textContent '
    },
    update(this: any, value: string) {
      this.el[this.attr] = value
    }
  },
  // @ | v-on
  on: {
    priority: ON,
    update(this: any, handler: (...arg: any) => any) {
      if (this.handler) {
        off(this.el, this.descriptor.arg, this.handler)
      }
      this.handler = handler
      on(this.el, this.descriptor.arg, this.handler)
    },
    unbind(this: any) {
      if (this.handler) {
        off(this.el, this.descriptor.arg, this.handler)
      }
    }
  },
  // : | v-bind
  bind: {
    priority: BIND,
    bind(this: Directive) {
      this.attr = this.descriptor.arg
    },
    update(this: Directive, value: any) {
      this.el?.setAttribute(this.attr, value)
    }
  },
  // v-model
  model: {
    priority: MODEL,
    bind() {}
  },
  // v-html
  html: {
    update(this: Directive, value: any) {
      this.el!.innerHTML = value
    }
  },
  // v-show
  show: {
    update(this: Directive, value: any) {
      this.el!.style.display = !!value ? '' : 'none'
    }
  },
  // v-if
  if: {
    priority: IF,
    bind(this: Directive) {
      const el = this.el
      const next = el?.nextElementSibling
      if (next && getAttr(next, 'v-else') !== null) {
        remove(next)
        this.elseEl = next
      }
      // 占位节点
      this.anchor = document.createTextNode('')
      replace(el!, this.anchor)
      this.isFirst = true
    }
  },
  // v-for
  for: {
    priority: FormData,
    bind(this: Directive) {
      // item in address
      const re1 = /(.*)(?:in|of)(.*)/
      const re2 = /\((.*),(.*)\)/
      let match = this.expression!.match(re1)

      if (match) {
        let match1 = match[1].match(re2)
        if (match1) {
          this.valueKey = match1[1].trim()
          this.indexKey = match1[2].trim()
        } else {
          this.valueKey = match1![1].trim()
        }

        this.valueKey = match[1].trim()
        // 绑定在data中的数据源
        this.expression = match[2].trim()
      }

      this.anchor = document.createTextNode('')
      this.frag = document.createDocumentFragment()
      replace(this.el, this.anchor)
    },
    update(this: Directive, value: any[] | Object) {
      if (this.len) {
        while (this.len--) {
          remove((this.anchor as Element).previousElementSibling!)
        }
      }
      let cloneNode: HTMLElement | undefined
      let re1
      let re2
      let html

      if (typeof value !== 'object') {
        console.error(`${this.expression}必须为对象或者数组`)
        return
      }

      this.len = 0
      for (let key in value) {
        this.len++
        cloneNode = this.el?.cloneNode(true) as HTMLElement
        html = cloneNode.innerHTML
        if (this.valueKey) {
          re2 = new RegExp(`{{\\s*${this.valueKey}\\s*}}`, 'g')
          html = html.replace(re2, key)
        }
        cloneNode.innerHTML = html
        this.frag?.appendChild(cloneNode)
      }
      compile(this.vm, this.frag!)
      insert(this.frag!, this.anchor!)
    }
  },
  component: {
    priority: COMPONENT,
    bind(this: Directive) {
      this.anchor = document.createTextNode('')
      replace(this.el!, this.anchor)
      const child = this.build!()
      insert(child.$el, this.anchor)
    },
    build(this: Directive) {
      this.Component = this.vm.$options.component[this.expression!]
      if (!this.Component?.option.template) {
        this.Component!.option.template = '<div></div>'
      }
      const options = {
        name: this.expression,
        el: this.el?.cloneNode(true)
        // ...
      }
    }
  },
  prop: {
    bind(this: Directive) {
      const child = this.vm
      const parent = child._context
      const prop = this.descriptor.prop
      const childKey = prop!.path
      const parentKey = prop!.parentPath
      const parentWatcher = (this.parentWatcher = new Watcher()) //...
      defineReactive(child, prop?.path, parentWatcher.value)
    },
    unbind(this: Directive) {}
  },
  slot: {
    priority: SLOT,
    bind(this: Directive) {
      let name = getAttr(this.el!, 'name')
      if (name == null) {
        name = 'default'
      }
      const content = this.vm._slotContents && this.vm._slotContents[name]
      replace(this.el!, content)
    }
  }
}

function getValue(el: HTMLSelectElement, multi: boolean, init: boolean) {
  const res: string[] | null = multi ? [] : null
  let op
  let selected
  for (let i = 0; i < el.options.length; i++) {
    op = el.options[i]
    selected = init ? op.hasAttribute('selected') : op.selected
    if (selected) {
      if (multi) {
        res!.push(op.value)
      } else {
        return op.value
      }
    }
  }
  return res
}

export default directives
