import Dep from './dep'
import { MiniVue } from './main'
import { extend, isObject, makeGetterFn } from './utils'

let uid = 0

export class Watcher {
  id: number = 0
  sync: boolean = false
  dirty: any
  lazy: any
  deps: Dep[] | null = null
  depIds: Set<number> | null = null
  value: any | undefined
  filters: any = null

  getter: Function | undefined
  setter: Function | undefined

  constructor(
    public vm: MiniVue | null,
    public expression: Function | string,
    public cb: Function | null,
    options?: any
  ) {
    vm!._watchers.push(this)
    if (options) {
      extend(this, options)
    }
    this.id = uid++

    this.sync = options ? options.sync : false
    // 计算属性用到
    this.dirty = this.lazy

    this.deps = []

    // 存放dep的id
    this.depIds = new Set()

    if (typeof expression === 'function') {
      this.getter = expression
      this.setter = undefined
    } else {
      const res = parseExpression(expression)
      this.getter = res.get
      this.setter = (value: any) => {
        ;(vm as any)[expression] = value
      }
    }

    if (this.lazy) {
      this.value = undefined
    } else {
      this.value = this.get()
    }
  }

  get() {
    const vm = this.vm
    Dep.target = this
    let value = this.getter?.call(vm, vm)
    if (this.filters) {
      value = vm._applyFiletrs(value, this.filters)
    }
    Dep.target = null
    return value
  }

  set(value: any) {
    this.setter?.call(this.vm, value)
  }

  update() {
    if (this.lazy) {
      this.dirty = true
    } else if (!this.sync) {
      pushWatcher(this)
    } else {
      this.run()
    }
  }

  run() {
    const value = this.get()
    const oldValue = this.value
    this.value = value
    if (value !== oldValue || isObject(value)) {
      // 指令集中的 update
      this.cb?.call(this.vm, value, oldValue)
    }
  }

  addDep(dep: Dep) {
    if (!this.depIds?.has(dep.id)) {
      this.deps?.push(dep)
      this.depIds?.add(dep.id)
      dep.addSub(this)
    }
  }

  teardown() {
    this.vm._watchers.splice(this.vm._watchers.indexOf(this))
    let i = this.deps!.length
    while (i--) {
      this.deps![i].removeSub(this)
    }
    this.vm = this.cb = this.value = null
  }
}

// 如果对{{obj.a.b.msg}}求值，则建一个函数，返回vm.obj.a.b.msg
// name
function parseExpression(exp: string) {
  exp = exp.trim()
  const res: any = { exp }
  res.get = makeGetterFn(exp)
  return res
}
