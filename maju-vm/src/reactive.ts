import { EffectType, EffectOptions, RefType, KeyParam } from 'types';
import { isObject } from './utils';

const proxyCache = new WeakMap();
const rawCache = new WeakMap();
const trackMap = new WeakMap();
const effectBox: Array<EffectType> = [];


function runEffect(effect: EffectType, fn: Function): void {
  try {
    effectBox.push(effect);
    return fn();
  } finally {
    effectBox.pop();
  }
}

export function watchEffect(
  fn: Function,
  options: EffectOptions = { lazy: false }
): EffectType {
  const effect = () => {
    return runEffect(effect, fn);
  };
  if (!options.lazy) {
    effect();
  }
  effect.options = options;
  return effect;
}

function track(target: Object, key: KeyParam): void {
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

function trigger(target: Object, key: KeyParam): void {
  const depsMap = trackMap.get(target);
  if (!depsMap) return;
  const effects = depsMap.get(key);
  if (effects) {
    effects.forEach((effect: EffectType) => {
      if (effect.options.scheduler) {
        effect.options.scheduler();
      } else {
        effect();
      }
    });
  }
}

export function defineReactive(target: any) {
  if (!isObject(target)) return target;
  
  let observed = proxyCache.get(target);
  if (observed) return observed;
  if (rawCache.get(target)) return target;
  
  observed = new Proxy(target, {
    get(obj, key, receiver) {
      track(obj, key);

      const t = Reflect.get(obj, key, receiver);

      if (t._isRef) return t.value;

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
  rawCache.set(observed, target);
  
  return observed;
}

export function ref(value: any): RefType {
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

export function reactive(value: any): typeof Proxy {
  return defineReactive(value);
}

export function computed(fn: any, setter: Function): RefType {
  let cache: any;
  let dirty: boolean = true;

  const effect = watchEffect(fn, {
    lazy: true,
    scheduler() {
      if (!dirty) {
        dirty = true;
        trigger(v, 'value');
      }
    }
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
