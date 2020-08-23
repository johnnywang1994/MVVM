const proxyCache = new WeakMap();
const trackMap = new WeakMap();
const effectCache = [];

// reactive
function isFn(v) {
  return typeof v === 'function';
}

function isObject(v) {
  return v !== null && typeof v === 'object';
}

function setArray(arr, {
  push,
  pop
}) {
  Object.defineProperty(arr, 'push', {
    enumerable: false, // hide from for...in
    configurable: false, // prevent further meddling...
    writable: false, // see above ^
    value: function() {
      let n = this.length;
      for (let i = 0, l = arguments.length; i < l; i++, n++) {          
        push(arguments[i], n, this);
      }
      return n;
    }
  })
  Object.defineProperty(arr, 'pop', {
    enumerable: false, // hide from for...in
    configurable: false, // prevent further meddling...
    writable: false, // see above ^
    value: function() {
      const item = Array.prototype.pop.call(this);
      pop(item, null, this);
      return item;
    }
  })
}

function reactive(target) {
  return createReactive(target);
}

function createReactive(target, parent, key) {
  if (!isObject(target)) return target;
  let observed = proxyCache.get(target);
  if (observed) return target;
  if (Array.isArray(target)) {
    setArray(target, {
      push(item, index, arr) {
        defineReactive(arr, index, item);
        parent[key] = [...arr];
      },
      pop(item, index, arr) {
        parent[key] = [...arr];
      }
    });
  }
  Object.keys(target).forEach((key) => {
    defineReactive(target, key, target[key]);
  });
  proxyCache.set(target, true);
  return target;
}

function defineReactive(target, key, val) {
  createReactive(val, target, key);
  Object.defineProperty(target, key, {
    get() {
      track(target, key);
      return val;
    },
    set(newVal) {
      val = newVal;
      trigger(target, key);
      createReactive(val, target, key);
    },
  });
}

function set(target, key, value) {
  return defineReactive(target, key, value);
}

function effect(fn, options = { lazy: false }) {
  const effect = createEffect(fn);
  // if lazy set to true, it should be called manually at least once outside
  if (!options.lazy) {
    effect();
  }
  effect.computed = options.computed;
  effect.reset = options.reset;
  return effect;
}

function createEffect(fn) {
  const effect = function() {
    return runEffect(effect, fn);
  };
  return effect;
}

function runEffect(effect, fn) {
  try {
    effectCache.push(effect);
    return fn();
  } finally {
    effectCache.pop(effect);
  }
}

function computed(getter) {
  let initAttach = false;
  let needCache = true;
  const runner = effect(getter, {
    lazy: true,
    computed: true,
    reset() {
      needCache = true;
    }
  });
  let value = null;
  return {
    _isRef: true,
    oldValue: null,
    get value() {
      const applyNewEffect = effectCache[effectCache.length-1];
      // 首次取值，runner 掛載當前 effect
      if (!initAttach) {
        runner()
        initAttach = true;
      // 後續取值
      // 1. 掛載新 effect(將此 computed 對象用於其他 effect 中)
      // 2. 原依賴值改變(getter 內依賴值改變)
      }
      if (applyNewEffect || needCache) {
        this.oldValue = value;
        value = getter();
        needCache = false;
      }
      return value;
    }
  };
}

function track(target, key) {
  const effect = effectCache[effectCache.length - 1];
  if (effect) {
    let depsMap = trackMap.get(target);
    if (!depsMap) {
      trackMap.set(target, depsMap = new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = new Set());
    }
    if (!dep.has(effect)) {
      dep.add(effect);
    }
  }
}

function trigger(target, key) {
  const depsMap = trackMap.get(target);
  if (!depsMap) return;
  const effects = depsMap.get(key);
  if (effects) {
    effects.forEach(effect => {
      if (effect.computed) {
        effect.reset();
      } else {
        effect();
      }
    });
  }
}


// ViewModel
function getNode(str) {
  return new DOMParser().parseFromString(str, 'text/html').body.childNodes[0];
}

function getData(data) {
  if (isFn(data)) {
    return data();
  }
  return data || {};
}

function VM(options) {
  this.$options = options;
  this.$el = typeof options.el === 'string'
    ? document.querySelector(options.el)
    : options.el
      ? options.el
      : typeof options.template === 'string'
        ? getNode(options.template)
        : options.template;
  this.$parent = options.parent;
  this.$props = options.props;
  this.$components = options.components || {};
  this.$childrens = [];
  this.$data = reactive(getData(options.data));
  if (this.$el._forloop_) {
    this._setParent();
  } else if (this.$props) {
    this._setParent(this.$props);
  }
  this._setMethods();
  this._setComputed();
  if (this.$el) {
    compiler(this.$el, this);
  }
}

VM.prototype._setMethods = function() {
  const { methods } = this.$options;
  if (methods) {
    for (let key in methods) {
      this.$data[key] = methods[key].bind(this.$data);
    }
  }
};

VM.prototype._setComputed = function() {
  const { computed: com } = this.$options;
  if (com) {
    for (let key in com) {
      const newComputed = computed(com[key].bind(this.$data));
      Object.defineProperty(this.$data, key, {
        get: () => newComputed.value,
      })
    }
  }
}

VM.prototype._setParent = function(props) {
  const { parent } = this.$options;
  if (parent) {
    const inherit = (key, withSetter) => {
      if (!this.$data[key]) {
        Object.defineProperty(this.$data, key, {
          get: () => parent.$data[key],
          set: (newVal) => withSetter
            ? parent.$data[key] = newVal
            : console.error('Please use emit'),
        });
      }
    };
    if (props) {
      for (let i in props) {
        inherit(props[i], false);
      }
    } else {
      for (let key in parent.$data) {
        inherit(key, true);
      }
    }
  }
}


// compiler
const prefix = 'c-';
const directives = {
  text(el, binding) {
    el.textContent = binding.value;
  },
  html(el, binding) {
    el.innerHTML = binding.value;
  },
  show(el, binding) {
    el.style.display = binding.value ? null : 'none';
  },
  if: {
    bind(el, binding) {
      const ref = binding.ref = document.createComment('');
      const ctn = binding.ctn = el.parentNode;
      ctn.insertBefore(ref, el);
    },
    update(el, binding) {
      const { value, ref, ctn } = binding;
      if (value) {
        ctn.insertBefore(el, ref);
        ctn.removeChild(ref);
      } else {
        ctn.insertBefore(ref, el);
        ctn.removeChild(el);
      }
    },
  },
  bind(el, binding) {
    const { raw, value } = binding; 
    el.setAttribute(raw, value);
  },
  on(el, binding) {
    const { raw: eventType, value, oldValue } = binding;
    const fn = value;
    if (oldValue) {
      el.removeEventListener(eventType, oldValue);
    }
    if (eventType && fn) {
      el.addEventListener(eventType, fn, false);
    }
  },
  for: {
    bind(el, binding) {
      const ref = binding.ref = document.createComment('');
      const ctn = el.parentNode;
      binding.collection = new Set();
      ctn.insertBefore(ref, el);
      ctn.removeChild(el);
      el._forloop_ = true;
    },
    update(el, binding, vm) {
      const { value, ref, collection } = binding;
      const ctn = binding.ctn = ref.parentNode;
      if (collection.size > 0) {
        collection.forEach((copy) => {
          ctn.removeChild(copy);
        });
        collection.clear();
      }
      for (let i in value) {
        const copy = this.buildItem(el, binding, vm, value[i]);
        collection.add(copy);
      }
    },
    buildItem(el, binding, vm, bindItem) {
      const { item, ref, ctn } = binding;
      const node = el.cloneNode(true);
      node._forloop_ = true;
      const childVM = new VM({
        el: node,
        parent: vm,
        data: {
          [item]: bindItem
        }
      });
      ctn.insertBefore(node, ref);
      return node;
    },
  },
};

function isElementNode(node) {
  return node.nodeType === 1;
}

function isTextNode(node) {
  return node.nodeType === 3;
}

function isDirective(attrName) {
  return attrName.startsWith(prefix);
}

function isComponent(tagName, comps) {
  return Object.keys(comps).includes(tagName);
}

function isEventDirective(attrName) {
  return attrName.indexOf('on') === 0;
}

function hasChildNodes(node) {
  return node.childNodes && node.childNodes.length;
}

function getBinding(attr) {
  const { name, value } = attr;
  let [key, raw] = name.split(':');
  key = key.split('-')[1];
  const dir = directives[key];
  const [item, list] = value.split(' in ');
  return {
    name,
    key,
    raw,
    dir,
    ...(list ? {
      item,
      value: list
    } : { value }),
  };
}

function getRenderedBinding(binding, vm) {
  const rendered = renderAttr(binding.value, vm.$data);
  return {
    ...binding,
    get oldValue() {
      return rendered.oldValue;
    },
    get value() {
      return rendered.value;
    },
  };
}

function compiler(el, vm) {
  const fg = node2Fragment(el);
  compileNode(fg, vm);
  el.appendChild(fg);
}

function node2Fragment(node) {
  const fg = document.createDocumentFragment();
  while (node.firstChild) {
    fg.appendChild(node.firstChild);
  }
  return fg;
}

function compileNode(node, vm) {
  if (node._forloop_) return;
  const childs = node.childNodes;
  let child = null;
  // "forEach" wont't dynamically get array's length
  for (let i=0;i<childs.length;i++) {
    child = childs[i];
    if (isElementNode(child)) {
      const tagName = child.tagName.toLowerCase();
      if (isComponent(tagName, vm.$components)) {
        compileComponent(child, vm, node);
      } else {
        compileElement(child, vm);
      }
    } else if (isTextNode(child)) {
      compileText(child, vm);
    }
    if (hasChildNodes(child)) {
      compileNode(child, vm);
    }
  }
}

function compileElement(node, vm) {
  const attrs = node.attributes;
  [...attrs].forEach((attr) => {
    if (!isDirective(attr.name)) return;
    let binding = getBinding(attr);
    node.removeAttribute(binding.name);
    if (!binding.dir) return;
    binding = getRenderedBinding(binding, vm);
    if (isFn(binding.dir)) {
      effect(() => {
        binding.dir(node, binding);
      })
    } else {
      const { bind, update } = binding.dir;
      bind.call(binding.dir, node, binding, vm);
      effect(() => {
        update.call(binding.dir, node, binding, vm);
      });
    }
  })
}

function compileText(node, vm) {
  const text = node.textContent.trim(),
    reg = /\{\{(.*)\}\}/;

  if (reg.test(text)) {
    const textBinding = renderText(text, vm.$data);
    effect(() => {
      directives.text(node, textBinding);
    });
  }
}

function compileComponent(node, vm, ctn) {
  const tagName = node.tagName.toLowerCase();
  const rawComp = vm.$components[tagName];
  rawComp.parent = vm;
  const childVM = new VM(rawComp);
  vm.$childrens.push(childVM);
  ctn.replaceChild(childVM.$el, node);
}


// render
function replaceString(data) {
  return function(raw, content) {
    return `" + (() => ${content.trim()})() + "`;
  };
}

function renderText(str, data) {
  str = String(str);
  const t = function(str){
    str = str.replace(/\{\{\s*([^\}]+)?\s*\}\}/g, replaceString(data));
    return new Function('', 'return "'+ str +'";').bind(data);
  };
  const r = t(str);
  return computed(r);
}

function renderAttr(str, data) {
  str = String(str);
  const t = function(str) {
    str = `(() => ${str})()`;
    return new Function('', `return ${str};`).bind(data);
  };
  const r = t(str);
  return computed(r);
}

const test = {
  props: ['name'],
  template: '<div class="test-components">{{ this.msg }}</div>',
  data() {
    return {
      msg: 'Hello Test'
    };
  }
};


const app = new VM({
  el: '#app',
  components: {
    test,
  },
  data: {
    name: 'Johnny',
    age: 30,
    link: 'https://www.google.com',
    seen: true,
    list: [
      {
        id: 1
      },
      {
        id: 2,
      },
      {
        id: 3,
      }
    ],
  },
  computed: {
    info() {
      return this.name + ' ' + this.age;
    }
  },
  methods: {
    onSeen(a) {
      console.log('is Seen!!', a);
    },
    onHide() {
      console.log('is Hide!!');
    },
    onFor(num) {
      console.log(num);
    },
    addItem() {
      const item = this.list.pop();
      console.log(item);
    }
  }
});

console.log(app);



















