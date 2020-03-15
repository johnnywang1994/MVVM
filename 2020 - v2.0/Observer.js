function Observer(data) {
  if (data) {
    this.setData(data);
  }
};

Observer.prototype = {
  setData(data) {
    this.$data = data;
    this.observe(this.$data);
  },
  observe(data) {
    const self = this;
    if (!data || typeof data !== 'object') return;
    Object.keys(data).forEach((key) => {
      self.defineReactive(data, key, data[key]);
    });
  },
  defineReactive(data, key, val) {
    const self = this;
    const deps = new DependStore();
    self.observe(val);
    Object.defineProperty(data, key, {
      enumerable: true,
      configurable: false,
      get() {
        DependStore.target && deps.addSubscribe(DependStore.target);
        // console.log(deps);
        return val;
      },
      set(nV) {
        if (val === nV) return;
        val = nV;
        self.observe(nV);
        deps.notify();
      },
    })
  }
};

function DependStore() {
  this.deps = [];
};

// container for watch instance temping
DependStore.target = null;

DependStore.prototype = {
  addSubscribe(watcher) {
    return this.deps.push(watcher);
  },
  notify() {
    this.deps.forEach((watcher) => watcher.update());
  },
};

