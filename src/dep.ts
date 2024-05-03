let uid = 0
Dep.target = null

interface DepThis {
  id: number
  subs: any[]
}

export type TDep = any

export default function Dep(this: DepThis) {
  this.id = uid++
  // watcher 实例
  this.subs = []
}

Dep.prototype = {
  depend() {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  },
  addSub(sub: any) {
    this.subs.push(sub)
  }
}
