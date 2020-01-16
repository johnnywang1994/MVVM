/*!
 * @johnnywang/Webc.js v1.0.0
 * (c) 2019 Johnny Wang
 * Released under the MIT License.]
 * 
 */
(function (global, factory){
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.Webc = factory());
}(this, function() { 'use strict';



  /* --- Observer --- */

  function Observer(data) {
    this.$data = data;
    this.observe(this.$data);
  }
  
  Observer.prototype = {
    observe(data) {
      const self = this;
      if (!data || typeof data !== 'object') return;
      Object.keys(data).forEach((key) => {
        self.defineReactive(data, key, data[key]);
      });
    },
    defineReactive(data, key, val) {
      const self = this;
      const dep = new Dep();
      self.observe(val);
      Object.defineProperty(data, key, {
        enumerable: true,
        configurable: false,
        get() {
          Dep.target && dep.addSub(Dep.target);
          return val;
        },
        set(nV) {
          if (nV === val) return;
          val = nV;
          self.observe(nV);
          dep.notify();
        }
      })
    }
  };

  
  /* --- Dep --- */

  function Dep() {
    this.subs = [];
  }
  
  Dep.prototype = {
    addSub(sub) {
      this.subs.push(sub);
    },
    notify() {
      this.subs.forEach((sub) => sub.update());
    }
  };


  /* --- Watcher --- */

  function Watcher(vm, exp, cb) {
    this.$vm = vm;
    this.$exp = exp;
    this.$cb = cb;
    this.init();
  }
  
  Watcher.prototype = {
    update() {
      this.run();
    },
    init() {
      this._hasInit = false;
      this.value = this.get();
      this._hasInit = true;
    },
    run() {
      const value = this.get();
      const oldValue = this.value;
      if (value !== oldValue) {
        this.value = value;
        this.$cb.call(this.$vm, value, oldValue);
      }
    },
    get() {
      !this._hasInit && (Dep.target = this);
      const value = this._getVMVal(this.$exp);
      Dep.target = null;
      return value;
    },
    _getVMVal(exp) {
      let val = this.$vm;
      exp = exp.split('.');
      exp.forEach((k) => {
        val = val[k];
      });
      return val;
    }
  };


  /* --- Compiler --- */

  function Compiler(el, { vm, prefix }) {
    this.$el = this.isElementNode(el) ? el : document.querySelector(el);
    this.$vm = vm;
    this.$prefix = prefix;
    if (this.$el) {
      this.init();
    }
  }
  
  Compiler.prototype = {
    init() {
      this.compileElement(this.$el);
    },
    compileElement(el) {
      const childNodes = el.childNodes, self = this;
      childNodes.forEach((node) => {
        if (self.isElementNode(node)) {
          self.compile(node);
        } else if (self.isTextNode(node)) {
          self.compileText(node);
        }
        if (self.hasChildNodes(node)) {
          self.compileElement(node);
        }
      });
    },
    compile(node) {
      const attrs = node.attributes, self = this;
      [...attrs].forEach((attr) => {
        const attrName = attr.name;
        if (self.isDirective(attrName)) {
          const dir = attrName.substring(self.$prefix.length + 1);
          const exp = attr.value.trim();
          // event
          if (self.isEventDirective(dir)) {
            self.directives['eventHandler'](node, self._getVMVal(exp), dir, self.$vm);
          // normal
          } else {
            self.directives[dir](node, self._getVMVal(exp));
            new Watcher(this.$vm, exp, function(value) {
              self.directives[dir](node, value);
            });
          }
          node.removeAttribute(attrName);
        }
      });
    },
    compileText(node) {
      const text = node.textContent.trim(),
        self = this,
        regTxt = /\{\{(.*)\}\}/;
      if (regTxt.test(text)) {
        const { exps, value } = self.renderText(text, self.$vm);
        self.directives.text(node, value);
        exps.forEach((exp) => {
          new Watcher(this.$vm, exp, function() {
            const { value } = self.renderText(text, self.$vm);
            self.directives.text(node, value);
          });
        });
      }
    },
    renderText(str, data) {
      const self = this;
      let exps = null;
      str = String(str);
      const t = function(str) {
        const re = /\{\{\s*([^\}]+)?\s*\}\}/g;
        exps = self.removeWrapper(str.match(re));
        str = str.replace(re, '" + data.$1 + "');
        return new Function('data', 'return "'+ str +'";');
      };
      let r = t(str);
      return {
        exps,
        value: r(data)
      };
    },
    removeWrapper(arr) {
      let ret = [];
      arr.forEach((exp) => {
        ret.push(exp.replace(/[\{|\}]/g, '').trim());
      });
      return ret;
    },
    // Tools
    isElementNode(node) {
      return node.nodeType === 1;
    },
    isTextNode(node) {
      return node.nodeType === 3;
    },
    isDirective(attrName) {
      return attrName.indexOf(this.$prefix) == 0;
    },
    isEventDirective(dir) {
      return dir.indexOf('on') === 0;
    },
    hasChildNodes(node) {
      return node.childNodes && node.childNodes.length;
    },
    _getVMVal(exp) {
      let val = this.$vm;
      exp = exp.split('.');
      exp.forEach((k) => {
        val = val[k];
      });
      return val;
    },
    // directives
    directives: {
      text(node, value) {
        node.textContent = value;
      },
      html(node, value) {
        node.innerHTML = value;
      },
      replace(node, value) {
        node.parentNode.replaceChild(value, node);
      },
      show(node, value) {
        node.style.display = Boolean(value) ? null : 'none';
      },
      eventHandler(node, value, dir, vm) {
        const eventType = dir.split(':')[1];
        const fn = value;
        if (eventType && fn) {
          node.addEventListener(eventType, fn.bind(vm), false);
        }
      }
    }
  };


  /* --- Webc --- */

  function Webc(tagName, opts) {
    this.$tagName = tagName;
    this.$opts = opts;
    this.$webcomponent = null;
    this.init();
    return this.$webcomponent;
  }
  
  Webc.prototype = {
    init() {
      this.defineTag();
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
          const { data, computed, methods, components, customize } = _opts;
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
    }
  };

  return Webc;

}));