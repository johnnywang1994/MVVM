const proxyCache = new WeakMap();
const trackMap = new WeakMap();
const effectCache = [];

function isObject(v) {
  return v !== null && typeof v === 'object';
}

function setArrayPush(arr, callback = () => {}) {
  Object.defineProperty(arr, 'push', {
    enumerable: false, // hide from for...in
    configurable: false, // prevent further meddling...
    writable: false, // see above ^
    value: function() {
      let n = this.length;
      for (let i = 0, l = arguments.length; i < l; i++, n++) {          
        this[n] = arguments[i];
        callback(this, n);
      }
      return n;
    }
  })
}

function reactive(target) {
  return createReactive(target);
}

function createReactive(target) {
  if (!isObject(target)) return target;
  let observed = proxyCache.get(target);
  if (observed) return target;
  if (Array.isArray(target)) {
    setArrayPush(target, function(arr, index) {
      defineReactive(arr, index, arr[index]);
    });
  }
  Object.keys(target).forEach((key) => {
    defineReactive(target, key, target[key]);
  });
  proxyCache.set(target, true);
  return target;
}

function defineReactive(target, key, val) {
  createReactive(val);
  Object.defineProperty(target, key, {
    get() {
      track(target, key);
      return val;
    },
    set(newVal) {
      val = newVal;
      trigger(target, key);
      createReactive(val);
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
    get value() {
      const applyNewEffect = effectCache[effectCache.length-1];
      // 首次取值，掛載當前 effect
      if (!initAttach) {
        value = runner();
        needCache = false;
        initAttach = true;
      // 後續取值
      // 1. 掛載新 effect(將此 computed 對象用於其他 effect 中)
      // 2. 原依賴值改變(getter 內依賴值改變)
      } else if (applyNewEffect || needCache) {
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


const data = reactive({
  name: 'johnny',
  age: 33
});

// 建立 computed
const info = computed(() => {
  console.log('Cache');
  return data.name + ' ' + data.age;
});

// 多次呼叫僅取值一次
console.log(info.value);
console.log(info.value);

// compute 用於其他 effect 中，呼叫原 getter 方法將此 effect 掛載到原依賴中
effect(() => {
  document.getElementById('html').innerHTML = info.value;
});
