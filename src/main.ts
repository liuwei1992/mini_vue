import { compile, compileProps } from './compile'
import Directive from './directive'
import directives from './directives'
import { mergeOptions } from './merge'
import observe from './observer'
import { query, replace } from './utils'
import { Watcher } from './watcher'

// function MiniVue(this: any, options: any) {
//   this._init(options)
// }
export type AnyObject = {
  [p: keyof any]: any
}

// 原型方法
// MiniVue.prototype = {
export class MiniVue {
  $el: Node | null = null
  $parent: any
  $root: MiniVue | undefined
  $children: any[] = []
  $options: any
  _isMiniVue: boolean = true
  _watchers: Watcher[] = []
  _events: AnyObject = {}
  _directives: any[] = []
  _context: any
  _data: any

  constructor(options: any) {
    this._init(options)
  }

  _init(options: any) {
    this.$parent = options.parent
    this.$root = this.$parent ? this.$parent.root : this
    this._context = options._context || this.$parent

    if (this.$parent) {
      this.$parent.$children.push(this)
    }

    options = this.$options = mergeOptions(MiniVue.options, options, this)

    this._callHook('init')
    this._initMixins()
    this._initComponents()
    this._initProps()
    this._initMethods()
    this._initData()
    this._initWatch()
    this._initComputed()
    this._initEvents()

    this._callHook('created')
    if (options.el) {
      this._compile()
    }
  }

  // 执行生命周期钩子
  _callHook(hook: any) {
    const handlers = this.$options[hook]

    if (typeof handlers === 'function') {
      handlers.call(this)
    } else if (handlers) {
      handlers.forEach((handler: Function) => {
        handler.call(this)
      })
    }
  }

  _initMixins() {
    let options = this.$options
    if (options.mixin) {
      this.$options = mergeOptions(options, options.mixin)
    }
  }

  _initComponents() {
    const { components } = this.$options
    const keys = Object.keys(components)
    keys.forEach((key) => {
      components[key] = MiniVue.component(key, components[key], true)
    })
  }

  // ？？？
  _initProps() {
    const options = this.$options
    let el = options.el
    const props = options.props
    el = options.el = query(el)

    if (props && el.nodeType == 1) {
      compileProps(this, el, props)
    }
  }

  _initMethods() {
    const methods = this.$options.methods || {}

    Object.keys(methods).forEach((key) => {
      this[key] = bind(methods[key], this)
    })
  }

  _initData() {
    let data = this.$options.data || {}
    data = this._data = typeof data === 'function' ? data() : data

    Object.keys(data).forEach((key) => {
      this._proxy(this, '_data', key)
    })

    observe(this._data)
  }

  _initWatch() {
    if (this.$options.watch) {
      const watch = this.$options.watch
      Object.keys(watch).forEach((key) => {
        this.$watch(key, watch[key])
      })
    }
  }

  _initComputed() {
    if (this.$options.computed) {
      const { computed } = this.$options
      Object.keys(computed).forEach((key) => {
        Object.defineProperty(this, key, {
          enumerable: true,
          configurable: true,
          get: makeComputedGetter(computed[key], this),
          set: noop
        })
      })
    }
  }

  _compile() {
    const options = this.$options
    options.el = this.$el = query(options.el)
    // 处理slot插槽
    const tempEl = transclude(this.$el, options)
    if (tempEl) {
      this.$el = tempEl
      options.el.innerHTML = ''
      replace(options.el, this.$el)
    }

    resolveSlots(this, options._context)
    this._callHook('beforeCompile')

    compile(this, this.$el)
  }

  // this.data.xxx => this.xxx
  _proxy(target: any, sourceKey: string, key: string) {
    Object.defineProperty(target, key, {
      enumerable: true,
      configurable: true,
      get: function () {
        return this[sourceKey][key]
      },
      set: function (val: any) {
        this[sourceKey][key] = val
      }
    })
  }

  $watch(expOrFn: any, callback: any, options: any) {
    new Watcher(this, expOrFn, callback, options)
  }

  static options = {
    directives,
    components: {},
    filters: {}
  }

  static mixin(mixin: any) {
    this.options = mergeOptions(this.options, mixin)
  }

  // // options 属性合并
  static directive(dirName: string, options: any) {
    this.options.directives[dirName] = options
  }

  static use(plugin: any, ...args: any[]) {
    if (plugin.installed) {
      return
    }

    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, [this, ...args])
    } else {
      plugin.apply(null, args)
    }

    plugin.installed = true
    return this
  }

  static extend(extendOptions = {}) {
    const Super = this
    let isFirstExtend = Super.cid === 0
    if (isFirstExtend && extendOptions._Ctor) {
      return extendOptions._Ctor
    }

    const name = extendOptions.name || Super.options.name

    const Sub = new Function('return function' + classify(name))
    Sub.prototype = Object.create(Super.prototype)
    Sub.prototype.constructor = Sub
    Sub.options = mergeOptions(Super.options, extendOptions)
    Sub.super = Super
    Sub.extend = Super.extend
    Sub.component = Super.component

    if (name) {
      Sub.options.components[name] = Sub
    }

    if (isFirstExtend) {
      extendOptions._Ctor = Sub
    }

    return Sub
  }

  static component(this: any, id: string, definition: any, isPrivate: boolean) {
    if (!definition) {
      return this.options.components[id]
    } else {
      if (!definition.name) {
        definition.name = id
      }

      // core
      definition = MiniVue.extend(definition)

      if (!isPrivate) {
        this.options.components[id] = definition
      }

      return definition
    }
  }
}
// MiniVue.options = {
//   directives,
//   components: {},
//   filters: {}
// }
// export type VM = {
//   _watchers: Watcher[]
//   _directives: Directive[]
//   _callHook: (hook: string) => void
//   $options: {
//     directives: typeof directives
//     components: AnyObject
//     filters: AnyObject
//     data?: AnyObject | Function
//   }
//   _props: {}
//   _context: any
//   _slotContents?: any
// } & AnyObject

// options 属性合并
// MiniVue.directive = function (dirName: string, options: any) {
//   this.options.directives[dirName] = options
// }

// MiniVue.use = function (plugin: any, ...args: any[]) {
//   if (plugin.installed) {
//     return
//   }

//   if (typeof plugin.install === 'function') {
//     plugin.install.apply(plugin, [this, ...args])
//   } else {
//     plugin.apply(null, args)
//   }

//   plugin.installed = true
//   return this
// }

// class MyComponents extend MiniVue{}
// MiniVue.extend = function (extendOptions = {}) {
//   const Super = this
//   let isFirstExtend = Super.cid === 0
//   if (isFirstExtend && extendOptions._Ctor) {
//     return extendOptions._Ctor
//   }

//   const name = extendOptions.name || Super.options.name

//   const Sub = new Function('return function' + classify(name))
//   Sub.prototype = Object.create(Super.prototype)
//   Sub.prototype.constructor = Sub
//   Sub.options = mergeOptions(Super.options, extendOptions)
//   Sub.super = Super
//   Sub.extend = Super.extend
//   Sub.component = Super.component

//   if (name) {
//     Sub.options.components[name] = Sub
//   }

//   if (isFirstExtend) {
//     extendOptions._Ctor = Sub
//   }

//   return Sub
// }

// MiniVue.component = function (
//   this: any,
//   id: string,
//   definition: any,
//   isPrivate: boolean
// ) {
//   if (!definition) {
//     return this.options.components[id]
//   } else {
//     if (!definition.name) {
//       definition.name = id
//     }

//     // core
//     definition = MiniVue.extend(definition)

//     if (!isPrivate) {
//       this.options.components[id] = definition
//     }

//     return definition
//   }
// }

function transclude(el: Element, options: any) {
  if (!options.template) {
    return null
  }
  options._context = extractContent(el)
  let template = options.template.trim()
  const node = document.createElement('div')
  node.innerHTML = template
  let frag = extractContent(node, true).cloneNode(true)

  const replacer = frag.firstChild
  mergeAttrs(el, replacer)
  return replacer
}

const classifyRE = /(?:^|[-_\/])(\w)/g
function classify(str: string) {}

function makeComputedGetter(getter: Function, vm: any) {
  const watcher = new Watcher(vm, getter, null, {
    lazy: true
  })
  return function computedGetter() {
    if (watcher.dirty) {
      watcher.evalute()
    }
    if (Dep.target) {
      watcher.depend()
    }
    return watcher.value
  }
}
