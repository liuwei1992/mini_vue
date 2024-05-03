import { Watcher } from './watcher'

let uid = 0

// 发布者，收集watcher
export default class Dep {
  id: number
  subs: Watcher[] = []

  static target: Watcher | null = null

  constructor() {
    this.id = uid++
  }

  depend() {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  addSub(sub: Watcher) {
    this.subs.push(sub)
  }

  removeSub(sub: Watcher) {
    const index = this.subs.indexOf(sub)
    if (index > -1) {
      this.subs.slice(index, 1)
    }
  }

  notify() {
    this.subs.forEach((watcher) => {
      watcher.update()
    })
  }
}
