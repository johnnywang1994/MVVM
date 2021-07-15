// ref: https://juejin.im/post/6850418105500303367
const proxyCache = new WeakMap();
const rawCache = new WeakMap();
const trackMap = new WeakMap();
const effectBox = [];

function isObject(v) {
  return v !== null && typeof v === 'object';
}

function runEffect(effect, fn) {
  try {
    effectBox.push(effect);
    return fn();
  } finally {
    effectBox.pop(effect);
  }
}

function watchEffect(fn, options = { lazy: false }) {
  const effect = () => {
    return runEffect(effect, fn);
  };
  if (!options.lazy) {
    effect();
  }
  effect.options = options;
  return effect;
}

// 依賴追蹤
function track(target, key) {
  const effect = effectBox[effectBox.length - 1];
  if (effect) {
    let depsMap = trackMap.get(target);
    if (!depsMap) {
      trackMap.set(target, (depsMap = new Map()));
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, (dep = new Set()));
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
    effects.forEach((effect) => {
      if (effect.options.scheduler) {
        effect.options.scheduler();
      } else {
        effect();
      }
    });
  }
}

function defineReactive(target) {
  if (!isObject(target)) return target;
  
  let observed = proxyCache.get(target);
  // 拿取之前已產生的代理Proxy
  if (observed) return observed;
  // 避免重複代理Proxy
  if (rawCache.get(target)) return target;
  
  // proxy
  observed = new Proxy(target, {
    get(obj, key, receiver) {
      track(obj, key);
      const t = Reflect.get(obj, key, receiver);
      if (t._isRef) return t.value;
      // 深度自動代理Proxy
      return typeof obj[key] === 'object'
        ? defineReactive(t)
        : t;
    },
    set(obj, key, newVal, receiver) {
      const t = Reflect.set(obj, key, newVal, receiver);
      trigger(obj, key);
      return t;
    },
  });
  
  proxyCache.set(target, observed);
  rawCache.set(observed, target); // 映射表
  
  return observed;
}

function ref(value) {
  let _value = defineReactive(value);
  const v = {
    _isRef: true,
    get value() {
      track(v, 'value');
      return _value;
    },
    set value(newVal) {
      _value = newVal;
      trigger(v, 'value');
    },
  };
  return v;
}

function reactive(value) {
  return defineReactive(value);
}

function computed(fn, setter) {
  let cache;
  let dirty = true;

  const effect = watchEffect(fn, {
    lazy: true,
    scheduler(){
      if (!dirty) {
        dirty = true;
        trigger(v, 'value');
      }
    },
  });

  const v = {
    _isRef: true,
    get value() {
      if (dirty) {
        cache = effect();
        dirty = false;
      }
      track(v, 'value');
      return cache;
    },
    set value(newVal) {
      setter(newVal);
    },
  };
  return v;
}
