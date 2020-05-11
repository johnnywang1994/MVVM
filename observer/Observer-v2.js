function Dep() {
  this.subs = new Set();
}

Dep.prototype = {
  depend() {
    this.subs.add(Dep.update);
  },
  notify() {
    this.subs.forEach((sub) => sub());
  }
}


function Observer(obj) {
  this._deps = new Map();
  this.walk(obj);
  obj.observe = this.injectObserver(obj);
  obj._deps = this._deps;
  return obj;
}

Observer.prototype = {
  injectObserver(obj) {
    const ob = this;
    return (exp, cb) => {
      autorun(() => {
        ob._deps.get(exp).depend();
        cb.call(obj);
      });
    };
  },
  // Each walk pass a parentExp to its child
  walk(obj, parentExp = '') {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach(
      (key) => this.defineReactive(
        obj,
        key,
        obj[key],
        parentExp,
      )
    );
  },
  defineReactive(obj, key, val, parentExp) {
    const ob = this;
    const dep = new Dep();
    let nowExp = parentExp + (Array.isArray(obj) ? `${key}]` : key);
    ob._deps.set(nowExp, dep);
    ob.walk(val, nowExp + (Array.isArray(val) ? '[' : '.'));
    Object.defineProperty(obj, key, {
      get() {
        return val;
      },
      set(newValue) {
        if (newValue === val) return;
        val = newValue;
        ob.walk(val, nowExp + (Array.isArray(val) ? '[' : '.'));
        ob._deps.get(nowExp).notify();
      },
    });
  },
}


function autorun(update) {
  function wrapUpdate() {
    Dep.update = wrapUpdate;
    update();
    Dep.update = null;
  }
  wrapUpdate();
}

// Usage
const data = new Observer({
  name: 'Johnny',
  age: 30,
  info: {
    height: 170,
    weight: 50,
  },
  history: [1, 2, 3]
});

// observe property in data
data.observe('info.height', function() {
  console.log('Height changed');
});

data.observe('history[0]', function() {
  console.log('history index 0 changed');
});

