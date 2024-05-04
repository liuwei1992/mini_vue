import Dep from './dep'
import { def, hasOwn, isArray } from './utils'

export default function observe(value: any) {
  if (!value || typeof value !== 'object') {
    return
  }

  let ob

  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (!value._isMiniVue) {
    ob = new Observer(value)
  }
  return ob
}

class Observer {
  dep: Dep | undefined

  constructor(public value: any) {
    this.dep = new Dep()

    def(value, '__ob__', this)

    if (isArray(value)) {
      value.__proto__ = arrayMethods
      this.observeArray(value)
    } else {
      this.walk(value)
    }
  }

  walk(obj: any) {
    Object.keys(obj).forEach((key) => {
      defineReactive(obj, key, obj[key])
    })
  }
}

export function defineReactive(obj: {}, key: string, val: any) {
  const dep = new Dep()
  let childOb = observe(val)

  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get() {
      if (Dep.target) {
        dep.depend()

        if (childOb) {
          childOb.dep.depend()
        }
        
        if (isArray(val)) {
          val.forEach((v) => {
            v && v.__ob__ && v.__ob__.dep.depend()
          })
        }
      }
      return val
    },
    set(newVal) {
      if (val === newVal) return

      val = newVal
      childOb = observe(newVal)
      dep.notify()
    }
  })
}


