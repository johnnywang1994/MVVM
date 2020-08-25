import { proxyCache, trackMap, effectCache } from './config';
import { isObject, setArray } from './utils';

// reactive
export function reactive(target) {
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

export function set(target, key, value) {
  return defineReactive(target, key, value);
}

export function effect(fn, options = { lazy: false }) {
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

export function computed(getter) {
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