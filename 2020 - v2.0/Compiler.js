function Compiler(el, { vm, prefix }) {
  this.$el = el;
  this.$vm = vm;
  this.$prefix = prefix || 'm-';
}

Compiler.prototype = {
  // 編譯初始化調用
  init() {
    const self = this;
    self.defineGetters();
    if (this.$el) {
      const fg = self.node2Fragment(this.$el);
      self.compile(fg);
      this.$el.appendChild(fg);
    }
  },
  // Main
  defineProp(key, val) {
    Object.defineProperty(this, key, val);
  },
  defineGetters() {
    const self = this;
    self.defineProp('directiveKeys', {
      get() {
        return Object.keys(self.directives);
      }
    });
    self.defineProp('componentKeys', {
      get() {
        return Object.keys(self.$vm.$components);
      }
    });
  },
  node2Fragment(node) {
    const fg = document.createDocumentFragment();
    let child = null;
    while (child = node.firstChild) {
      fg.appendChild(child);
    }
    return fg;
  },
  compile(node) {
    const childNodes = node.childNodes, self = this;
    childNodes.forEach((child) => {
      // 一般節點
      if (self.isElementNode(child)) {
        const tagName = child.tagName.toLowerCase();
        // 子組件
        if (self.componentKeys.includes(tagName)) {
          self.createComponent(node, child, tagName);
        // HTML 節點
        } else {
          self.compileElement(child);
        }
      // 文字節點
      } else if (self.isTextNode(child)) {
        self.compileText(child);
      }
      // 遞迴子節點
      if (self.hasChildNodes(child)) {
        self.compile(child);
      }
    });
  },
  parseAttributes(node, VM) {
    const attrs = node.attributes, self = this;
    let obj = {};
    [...attrs].forEach((attr) => {
      const attrName = attr.name;
      const exp = attr.value;
      // 綁定父層資料
      if (self.isDirective(attrName)) {
        const propName = attrName.substring(self.$prefix.length).split(':')[1];
        const bindExps = self.filteExps([exp]);
        const fn = function() { return eval(exp); };
        obj[propName] = fn.call(self.$vm);
        bindExps.forEach((bindExp) => {
          // 每個綁定的父層依賴都添加 watcher，監聽修改子組件 prop 為新的值
          new Watcher(self.$vm, bindExp, function() {
            VM.updatePropData(propName, fn.call(self.$vm));
          });
        });
      // 一般字串 prop 值
      } else {
        obj[attrName] = exp;
      }
    });
    return obj;
  },
  createComponent(node, child, tagName) {
    const self = this;
    const comp = self.$vm.$components[tagName];
    const VM = comp.init();
    const propsMap = self.parseAttributes(child, VM);
    if (Object.keys(propsMap).length !== 0) {
      VM.insertPropData(propsMap);
    }
    VM.init();
    self.$vm.$childrens.push(VM);
    VM.$parent = self.$vm;
    node.replaceChild(VM.$el, child);
  },
  compileElement(node) {
    const attrs = node.attributes, self = this;
    [...attrs].forEach((attr) => {
      const attrName = attr.name;
      if (self.isDirective(attrName)) {
        const dir = attrName.substring(self.$prefix.length);
        const exp = attr.value;
        // 事件(exp is expression)
        if (self.isEventDirective(dir)) {
          self.eventHandler(node, exp, dir, self.$vm);
        }
        // 綁定(exp is expression)
        else if (self.isBindDirective(dir)) {
          self.bindHandler(node, exp, dir, self.$vm);
        }
        // 一般(exp is normal string)
        else {
          self.normalHandler(node, exp, dir, self.$vm);
        }
        node.removeAttribute(attrName);
      }
    });
  },
  compileText(node) {
    const text = node.textContent,
      self = this,
      reg = /\{\{(.*)\}\}/;
    if (reg.test(text)) {
      const { exps, value } = self.render(text.trim(), self.$vm);
      self.directives.text(node, value);
      exps.forEach((bindExp) => {
        new Watcher(self.$vm, bindExp, function() {
          const { value } = self.render(text.trim(), self.$vm);
          self.directives.text(node, value);
        });
      });
    }
  },
  render(str, data) {
    const self = this;
    let exps = null;
    str = String(str);
    const t = function(str) {
      const re = /\{\{\s*([^\}]+)?\s*\}\}/g;
      exps = self.removeWrapper(str.match(re));
      str = str.replace(re, '" + (() => $1)() + "');
      return new Function('', 'return "'+ str +'";').bind(data);
    };
    let r = t(str);
    return {
      exps: self.filteExps(exps),
      value: r(data),
    };
  },
  removeWrapper(arr) {
    let ret = [];
    arr.forEach((exp) => {
      ret.push(exp.replace(/[\{|\}]/g, '').trim());
    });
    return ret;
  },
  filteExps(arr) {
    let expsSet = new Set();
    let re = /this.?\w+/g;
    arr.forEach((exp) => {
      const result = exp.match(re);
      result.forEach((item) => expsSet.add(item.replace('this.', '')));
    });
    return [...expsSet];
  },
  isElementNode(node) {
    return node.nodeType === 1;
  },
  isTextNode(node) {
    return node.nodeType === 3;
  },
  hasChildNodes(node) {
    return node.childNodes && node.childNodes.length;
  },
  isDirective(attrName) {
    return attrName.startsWith(this.$prefix);
  },
  isEventDirective(dir) {
    return dir.indexOf('on') === 0;
  },
  isBindDirective(dir) {
    return dir.indexOf('bind') === 0;
  },
  _getVMVal(val, exp) {
    exp = exp.split('.');
    exp.forEach((k) => {
      let re = /\[(\d+)\]/gi;
      if (re.test(k)) {
        let _k = k.split('[')[0];
        let _i = k.split('[')[1].replace(']', '');
        val = val[_k][_i];
      } else {
        val = val[k];
      }
    });
    return val;
  },
  eventHandler(node, exp, dir, vm) {
    const eventType = dir.split(':')[1];
    if (eventType) {
      const fn = function() {
        const result = eval(exp);
        if (typeof result === 'function') {
          result.call(vm);
        }
      };
      node.addEventListener(eventType, fn.bind(vm), false);
    }
  },
  bindHandler(node, exp, dir, vm) {
    const self = this;
    const bindDir = dir.split(':')[1];
    const fn = function() { return eval(exp); };
    if (self.directiveKeys.includes(bindDir)) {
      const targetDirective = self.directives[bindDir];
      const bindExps = self.filteExps([exp]);
      targetDirective(node, fn.call(vm), dir, vm);
      bindExps.forEach((bindExp) => {
        new Watcher(vm, bindExp, function() {
          targetDirective(node, fn.call(vm), dir, vm);
        });
      });
    }
  },
  normalHandler(node, exp, dir, vm) {
    const self = this;
    if (self.directiveKeys.includes(dir)) {
      const targetDirective = self.directives[dir];
      targetDirective(node, exp, dir, vm);
    }
  },
  directives: {
    text(node, value, dir, vm) {
      node.textContent = value;
    },
    html(node, value, dir, vm) {
      node.innerHTML = value;
    },
    show(node, value, dir, vm) {
      if (typeof value == 'string') {
        value = eval(value);
      }
      node.style.display = value ? null : 'none';
    },
  },
};
