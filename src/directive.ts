import directives from './directives'
import { MiniVue } from './main'
import { extend } from './utils'
import { Watcher } from './watcher'
export type TDirectives = typeof directives
export interface IDescriptor<D extends keyof TDirectives> {
  vm: MiniVue
  el?: HTMLElement | Node
  arg?: string // v-on: v-bind: 后面的内容
  name: 'on' | 'bind' | 'component' | 'slot' | 'text' //... on bind
  attr?: string
  expression?: string // {xxx}
  filters?: {
    name: string
  }[]
  def: TDirectives[D]
  modifiers?: {
    literal: boolean
  }
  prop?: {
    path: string
    parentPath: string
  }
  raw?: any[] | Object
}

interface IComponent {
  option: {
    template: string
  }
}

// 13
export default class Directive {
  name
  expression
  el: Node | null = null
  filters
  modifiers
  literal

  _update: Function | null = null
  _watcher: any = null
  // directives 中定义的方法
  update: Function | null = null
  bind: Function | null = null
  unbind: Function | null = null
  build: Function | null = null
  valueKey: any = null
  indexKey: any = null
  anchor: Node | null = null
  frag: DocumentFragment | null = null
  len: number | null = null
  attr: any | null = null
  elseEl: Element | null = null
  isFirst: boolean | null = null
  Component: IComponent | null = null
  parentWatcher: any | null = null
  handler: EventListenerOrEventListenerObject | null = null

  constructor(public descriptor: IDescriptor<any>, public vm: MiniVue) {
    this.name = descriptor.name
    this.expression = descriptor.expression
    this.el = descriptor.el
    this.filters = descriptor.filters
    this.modifiers = descriptor.modifiers
    this.literal = this.modifiers && this.modifiers.literal
  }

  _bind() {
    const descriptor = this.descriptor
    const def = descriptor.def
    if (typeof def === 'function') {
      this.update = def
    } else {
      // object assign
      extend(this, def)
    }

    if (this.bind) {
      this.bind()
    }
    if (this.literal) {
      this.update && this.update(descriptor.raw)
    } else if (this.expression) {
      const dir = this
      if (this.update) {
        this._update = function (value: any, oldVal: any) {
          dir.update!(value, oldVal)
        }
      }

      const watcher = (this._watcher = new Watcher(
        this.vm,
        this.expression,
        this._update,
        { filters: this.filters }
      ))
      if (this.update) {
        this.update(watcher.value)
      }
    }
  }

  _set(value: any) {
    this._watcher.set(value)
  }

  _teardown() {
    this.unbind && this.unbind()

    this._watcher && this._watcher.teardown()

    this.vm = this.el = this._watcher = null
  }
}
