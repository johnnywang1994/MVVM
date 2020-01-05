/**
 * MVVM
 * @param {object} options
 * 遍歷 data, computed, methods 的所有屬性進入 mvvm 實例後
 * 先對 data 添加劫持，最後傳入 mvvm 實例進行 compile，將各節點使用的 watcher 掛載到對應的位置
 * 會需要傳入整個 mvvm 實例給 compiler 是因為必須將所有數據包含 computed 及 method，都提供給使用者在模板中。
 */
function MVVM(options) {
  this.$options = options;
  this.$data = this.$options.data;
  this.$computed = this.$options.computed;
  this.$methods = this.$options.methods;

  this.walk(this.$data, (key) => this._proxyData(key));
  this.walk(this.$computed, (key) => this._proxyComputed(key));
  this.walk(this.$methods, (key) => this._proxyMethods(key));
  typeof this.$options.created === 'function'
    && this.$options.created.call(this);  // Created 執行

  window.addEventListener('DOMContentLoaded', () => {
    this.$el = this.$options.el || document.body;
    this.init();
  });
}

MVVM.prototype = {
  init() {
    new Observer(this.$data);
    new Compiler(this.$el, {
      vm: this,
      prefix: this.$options.prefix || 'jw'
    });
  },
  walk(data, fn) {
    return Object.keys(data).forEach(fn);
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
  }
}
