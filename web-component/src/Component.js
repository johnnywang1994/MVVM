// listen to web component attribute
// ref: https://alligator.io/web-components/attributes-properties/
function Webc(tagName, opts) {
  this.$tagName = tagName;
  this.$opts = opts;
  this.$webcomponent = null;
  this.init();
  return this.$webcomponent;
}

Webc.getModule = function(tagName) {
  return Webc.prototype.$modules[tagName];
}

Webc.getComponent = function(name) {
  return Webc.prototype.$components[name];
}

Webc.prototype = {
  init() {
    this.defineTag();
    this.setModule(this.$tagName, this.$webcomponent);
  },
  defineTag() {
    const self = this;
    let { html, prefix = 'w' } = self.$opts;
    html = self.renderComponent(html);
    /* closure: data, el, root are private */
    self.$webcomponent = class extends HTMLElement {
      constructor(options) {
        super();
        // handle options
        const _opts = this.$options = options || {};
        const { name, data, computed, methods, components, customize } = _opts;
        this.$data = data || {};
        this.$computed = computed;
        this.$methods = methods;
        this.$components = components;
        this.$el = self.getNode(html);
        this.$root = this.initRoot(this, _opts);
        this.$vm = Object.create(null);

        // set MVVM
        self.walk(this.$data, (key) => self._proxyData(this, key));
        self.walk(this.$computed, (key) => self._proxyComputed(this, key));
        self.walk(this.$methods, (key) => self._proxyMethods(this, key));
        self.walk(this.$components, (key) => self._proxyComponents(this, key));
        new Observer(this.$data);
        new Compiler(this.$el, {
          vm: this.$vm,
          prefix
        });
        
        // set Web Component
        this.insertStyle(this.$root, _opts);
        customize && typeof customize === 'funciton' && customize.call(this);
        this.$root.appendChild(this.$el);
        self.setComponent(name || self.$tagName, this);
      }

      initRoot(originalRoot, options) {
        const useShadow = document.head.attachShadow && options.shadow;
        return useShadow ? originalRoot.attachShadow({mode: 'open'}) : originalRoot;
      }

      insertStyle(root, options) {
        if (options.stylesheet) {
          const linkEl = document.createElement('link');
          linkEl.setAttribute('rel', 'stylesheet');
          linkEl.setAttribute('href', options.stylesheet);
          root.appendChild(linkEl);
        }
      }
    }
    customElements.define(self.$tagName, self.$webcomponent);
  },

  /* Tool */
  getNode(str) {
    return new DOMParser().parseFromString(str, 'text/html').body.childNodes[0];
  },
  renderComponent(str) {
    str = String(str);
    const t = function(str) {
      const re = /<%\s*([^%>]+)?\s*%>/g;
      str = str.replace(re, '<span w-replace="$1"></span>');
      return str;
    };
    return t(str);
  },

  /* MVVM */
  walk(data, fn) {
    if (!data) return;
    return Object.keys(data).forEach(fn);
  },
  _proxyData(target, key) {
    Object.defineProperty(target.$vm, key, {
      enumerable: true,
      configurable: false,
      get() {
        return target.$data[key];
      },
      set(nV) {
        target.$data[key] = nV;
      }
    });
  },
  _proxyComputed(target, key) {
    const computed = target.$computed;
    Object.defineProperty(target.$vm, key, {
      get: typeof computed[key] === 'function' 
              ? computed[key]
              : computed[key].get,
      set: typeof computed[key] !== 'function'
              ? computed[key].set
              : function() {}
    });
  },
  _proxyMethods(target, key) {
    const methods = target.$methods;
    Object.defineProperty(target.$vm, key, {
      get: typeof methods[key] === 'function' 
              ? () => methods[key] 
              : function() {}
    });
  },
  _proxyComponents(target, key) {
    Object.defineProperty(target.$vm, key, {
      enumerable: true,
      configurable: false,
      get() {
        return target.$components[key];
      }
    });
  },

  /* Module methods */
  $modules: {},
  $components: {},
  setModule(tagName, data) {
    if (Webc.prototype.$modules[tagName]) return console.error('[Webc]: Dont redefined module.');
    return Webc.prototype.$modules[tagName] = data;
  },
  setComponent(name, data) {
    if (Webc.prototype.$components[name]) return console.error('[Webc]: Dont redefined component.');
    return Webc.prototype.$components[name] = data;
  }
};