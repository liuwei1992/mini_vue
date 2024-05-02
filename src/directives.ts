const ON = 700
const MODEL = 800
const BIND = 850
const COMPONENT = 1500
const IF = 2100
const FOR = 2200
const SLOT = 2300

const handles = {
  text: {
    bind() {
      const self = this
      this.listener = function () {
        self.set(this.value)
      }
      on(this.el, 'input', this.listener)
    },
    update(value: any) {
      this.el.value = value
    },
    unbind() {
      off(this.el, 'input', this.listener)
    }
  },
  select: {
    bind() {}
  }
}

// 针对各种指令的回调函数
export default {
  // {text}
  text: {
    bind() {
      this.attr = this.el.nodeType === 3 ? 'data' : 'textContent'
    },
    update(value: string) {
      this.el[this.attr] = value
    }
  },
  // @ | v-on
  on: {
    priority: ON,
    update(handler: (...arg: any) => any) {
      if (this.handler) {
        off(this.el, this.descriptor.arg, this.handler)
      }
    }
  }
}
