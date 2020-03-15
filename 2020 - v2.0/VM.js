function ViewModel(options) {
  this.$options = options;
  this.$el = this.$options.el || document.body;
  this.$data = this.$options.data;
  this.$computed = this.$options.computed;
  this.$methods = this.$options.methods;
  this.$components = this.$options.components;
  this.$props = this.$options.props;
  this.$childrens = [];

  this.walk(this.$data, (key) => this._proxyData(key));
  this.walk(this.$computed, (key) => this._proxyComputed(key));
  this.walk(this.$methods, (key) => this._proxyMethods(key));

  window.addEventListener('DOMContentLoaded', () => {
    this.init();
  });
}

ViewModel.prototype = {
  init() {
    new Observer(this.$data);
    new Compiler(this.$el, {
      vm: this,
    }).init();
    return this;
  },
  walk(data, fn) {
    if (data) {
      Object.keys(data).forEach(fn);
    }
  },
  _proxyData(key) {
    const self = this;
    Object.defineProperty(self, key, {
      enumerable: true,
      configurable: false,
      get() {
        return self.$data[key];
      },
      set(nV) {
        self.$data[key] = nV;
      }
    });
  },
  _proxyComputed(key) {
    const self = this;
    const computed = this.$computed;
    if (typeof computed === 'object') {
      Object.defineProperty(self, key, {
        get: typeof computed[key] === 'function' 
                ? computed[key]
                : computed[key].get,
        set: typeof computed[key] !== 'function'
                ? computed[key].set
                : function() {}
      });
    }
  },
  _proxyMethods(key) {
    const self = this;
    const methods = this.$methods;
    if (typeof methods === 'object') {
      Object.defineProperty(self, key, {
        get: typeof methods[key] === 'function' 
                ? () => methods[key] 
                : function() {},
        set: function() {}
      });
    }
  },
  // 插入 prop 資料到 data，以利後續 init 時，將 prop 一併納入 watcher 監聽變化
  insertPropData(propData) {
    this.$propData = propData;
    this.$data = Object.assign(this.$data, this.$propData);
    this._proxyProps();
  },
  updatePropData(propName, value) {
    this.$propData[propName] = value;
    // 觸發 component 更新 data 綁定的 watchers
    this.$data[propName] = value;
  },
  _proxyProps() {
    const self = this;
    const props = this.$props;
    // propData only used for check, real will get from $data for reactive
    const propDataMap = Object.keys(this.$propData);
    if (Array.isArray(props)) {
      props.forEach((key) => {
        if (propDataMap.includes(key)) {
          Object.defineProperty(self, key, {
            get() {
              return self.$data[key];
            },
            set: function() {}
          })
        }
      });
    }
  }
}
