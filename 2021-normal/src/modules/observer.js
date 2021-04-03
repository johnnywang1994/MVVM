const proxyCache = new WeakMap();
const trackMap = new WeakMap();
const effectCache = [];

function runEffect(effect, fn) {
  try {
    effectCache.push(effect);
    return fn();
  } finally {
    effectCache.pop(effect);
  }
}

function createEffect(fn) {
  const effect = () => {
    runEffect(effect, fn);
  };
  return effect;
}

export function watchEffect(fn) {
  const effect = createEffect(fn);
  effect();
  return effect;
}

function track(target, key) {
  const effect = effectCache[effectCache.length - 1];
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
    effects.forEach((effect) => effect());
  }
}

/* eslint no-use-before-define: 0 */
function createReactive(target) {
  if (typeof target !== 'object') return target;
  // check cache
  const observed = proxyCache.get(target);
  if (observed) return target;
  Object.keys(target).forEach((key) => {
    defineReactive(target, key, target[key]);
  });
  // set cache
  proxyCache.set(target, true);
  return target;
}

function defineReactive(target, key, val) {
  createReactive(val);

  Object.defineProperty(target, key, {
    get: () => {
      track(target, key);
      return val;
    },
    set: (newVal) => {
      /* eslint no-param-reassign: 0 */
      console.log('before-setter');
      if (typeof newVal !== 'object' && val === newVal) return;
      console.log('setter:', target, key);
      val = newVal;
      trigger(target, key);
      createReactive(val);
    },
  });
}

export function reactive(target) {
  return createReactive(target);
}
