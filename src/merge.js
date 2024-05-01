function guardComponents(options) {
  if (options.components) {
    const { components } = options
    const keys = Object.keys(components)
    keys.forEach((key) => {
      components[key] = MiniVue.component(key, components[key], true)
    })
  }
}
export function mergeOptions(parent, child, vm) {
  // 自定义组件继承 Vue ，还没有实例化
  guardComponents(child)
  const options = {}
  let key

  if (child.extends) {
    parent =
      typeof child.extends === 'function'
        ? mergeOptions(parent, child.extends, vm)
        : parent
  }

  if (child.mixins) {
    for (const i = 0; i < child.mixins.length; i++) {
      const mixin = child.mixins[i]
      // const mixinOptions = mixin.prototype instanceof MiniVue ? mixin.options: mixin
      parent = mergeOptions(parent, mixinOptions, vm)
    }
  }

  for (key in parent) {
    mergeField(key)
  }

  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key)
    }
  }

  function mergeField(key) {
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
  }

  return options
}
