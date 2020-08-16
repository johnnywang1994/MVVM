// ref: https://juejin.im/post/6850418105500303367
const proxyCache = new WeakMap();
const rawCache = new WeakMap();
const trackMap = new WeakMap();
const effectCache = [];

function isObject(v) {
  return v !== null && typeof v === 'object';
}

function reactive(target) {
  return createReactive(target);
}

function createReactive(target) {
  if (!isObject(target)) return target;
  let observed = proxyCache.get(target);
  // 拿取之前已產生的代理Proxy
  if (observed) return observed;
  // 避免重複代理Proxy
  if (rawCache.get(target)) return target;
  const handlers = {
    get: (target, key, receiver) => {
      const res = Reflect.get(target, key, receiver);
      if (res._isRef) return res.value;
      track(target, key);
      // 深度自動代理Proxy
      return reactive(res);
    },
    set: (target, key, value, receiver) => {
      const res = Reflect.set(target,key,value,receiver);
      trigger(target, key);
      return res;
    },
  }
  
  observed = new Proxy(target, handlers);
  proxyCache.set(target, observed);
  rawCache.set(observed, target); // 映射表
  return observed;
}

// effect 實現
function effect(fn) {
  const effect = createEffect(fn);
  effect();
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

// 依賴追蹤
function track(target, key) {
  const effect = effectCache[effectCache.length-1];
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
    effects.forEach((effect) => effect());
  }
}

// ref 實現
function ref(raw) {
  raw = isObject(raw) ? reactive(raw) : raw;
  const v = {
    _isRef: true,
    get value() {
      track(v, '');
      return raw;
    },
    set value(newVal) {
      raw = newVal;
      trigger(v, '');
    }
  };
  return v;
}


const myName = ref('johnny');
const d = reactive({
  a: myName
})

console.log(d.a);