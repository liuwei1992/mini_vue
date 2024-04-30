const objd = {
  bind() {
    console.log('bind')
  },
  update(value) {
    console.log('update' + value)
  },
  unbind() {
    console.log('unbind')
  }
}

MiniVue.directive('my-directive', objd)

MiniVue.mixin({
  methods: {
    mix() {
      console.log('一个测试函数')
    }
  }
})

const myComponentObj = {
  props: ['name'],
  data() {
    return {
      content: '这是一个组件'
    }
  },
  directives: {
    'my-directive': objd
  },
  templete:
    '\
            <div class="blog-post">\
              <p @click="test">{{content}}</p>\
              <p>{{name.a.msg}}</p>\
              <slot name="header"></slot>\
              <p v-my-directive="content">新指令</p>\
              <slot></slot>\
            </div>',
  methods: {
    test() {
      this.$emit('send', 'haha')
    }
  }
}

MiniVue.filter('endding', function (value) {
  return value + 'endding'
})

const MyPlugin = {}

MyPlugin.install = function (MiniVue, options) {
  // 1、添加全局方法互或属性
  MiniVue.myGlobalMethod = function () {
    console.log('这是 一个插件')
  }

  // 2.添加全局资源
  MiniVue.directive('my-plugin', {
    bind() {
      console.log('my-plugin,bind')
    },
    update(value) {
      console.log('my-plugin,update' + value)
    },
    unbind() {
      console.log('my-plugin,unbind')
    }
  })
}

MiniVue.use(MyPlugin)

const vm = new MiniVue({
  el: '#app',
  data: {
    newAge: 20,
    age: 18,
    name: 'lw',
    obj: {
      a: {
        msg: 'abc'
      }
    },
    select: ['v1', 2, 3, 4],
    pick: '',
    checkedName: [],
    address: ['中国', '天津', '南开'],
    html: '<span style="color:red">this is a v-html</span>',
    show: 'a',
    newAddress: ['银河', '太阳', '地球'],
    if: true
  },
  init() {
    console.log('init')
  },
  created() {
    console.log('created')
  },
  beforeCompile() {
    console.log('beforeCompile')
  },
  compiled() {
    console.log('compiled')
  },
  destroyed() {
    console.log('destroyed')
  },
  directives: {
    'my-directive': objd
  },
  methods: {
    increase() {
      this.age++
    },
    reset() {
      this.address = ['中国', '天津', '南开']
    },
    sayHi() {
      console.log('父组件有一个sayHi方法')
    },
    sayTest(msg) {
      console.log('hi, ' + msg)
    }
  },
  computed: {
    comTest() {
      return this.age + ' ' + this.name
    }
  },
  filters: {
    capitalize(value) {
      if (!value) {
        return ''
      }
      value = value.toString()
      return value.charAt(0).toUpperCase() + value.slice(1)
    }
  },
  components: {
    'my-component': myComponentObj
  },
  mixin: {
    methods: {
      newMixin() {
        console.log('newMixin')
      }
    }
  },
  computed: {
    comTest() {
      return this.age + '   ' + this.name
    }
  }
})

export default {}
