function MiniVue(options) {
  this._init(options)
}

MiniVue.options = {
  directives,
  components: {},
  filters: {}
}

// options 属性合并
MiniVue.mixin = function (mixin) {
  this.options = mergeOptions(this.options, mixin)
}

MiniVue.directive = function (dirName, options) {
  this.options.directives[dirName] = options
}

MiniVue.use = function (plugin, ...args) {
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

// class MyComponents extend MiniVue{}
MiniVue.extend = function (extendOptions = {}) {
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

MiniVue.component = function (id, definition, isPrivate) {
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

// 原型方法
MiniVue.prototype = {
  constructor: MiniVue,

  _init(options) {
    this.$el = null
    this.$parent = options.parent
    this._isMiniVue = true
    this.$root = this.$parent ? this.$parent.root : this
    this.$children = []

    this._watchers = []
    this._events = {}
    this._directives = []
    this._context = options._context || this.$parent

    if (this.$parent) {
      this.$parent.$children.push(this)
    }

    options = this.$options = mergeOptions(
      this.constructor.options,
      options,
      this
    )

    this.this._callHook('init')('init')
  }

  // 执行生命周期钩子
  _callHook(hook) {
    const handlers = this.$options[hook]

    if(typeof handlers === 'function'){
      handlers.call(this)
    }else if(handlers){
      handlers.forEach(handler => {
        handler.call(this)
      })
    }
  }

}

export default MiniVue
