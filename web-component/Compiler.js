function Compiler(el, { data, prefix }) {
  this.$el = this.isElementNode(el) ? el : document.querySelector(el);
  this.$data = data;
  this.$prefix = prefix;
  if (this.$el) {
    this.init();
  }
}

Compiler.prototype = {
  init() {
    this.compileElement(this.$el);
  },
  // 第一步：分析節點類型
  compileElement(el) {
    const childNodes = el.childNodes, self = this;
    childNodes.forEach((node) => {
      if (self.isElementNode(node)) {
        self.compile(node);
      } else if (self.isTextNode(node)) {
        self.compileText(node);
      }
      // 若節點中還有子節點，遞迴此步驟
      if (self.hasChildNodes(node)) {
        self.compileElement(node);
      }
    });
  },
  // 第二步：編譯不同類型的節點
  // 1. 編譯標籤：比對屬性指令，並調用對應的指令函數後，加入監聽器
  compile(node) {
    const attrs = node.attributes, self = this;
    [...attrs].forEach((attr) => {
      const attrName = attr.name;
      if (self.isDirective(attrName)) {
        const dir = attrName.substring(self.$prefix.length + 1); // +1 因為 v- 的 -
        const exp = attr.value;
        // 事件屬性
        if (self.isEventDirective(dir)) {
          self.directives['eventHandler'](node, self._getDataVal(exp), dir, self.$data);
        // 一般
        } else {
          self.directives[dir](node, self._getDataVal(exp));
          new Watcher(this.$data, exp, function(value) {
            self.directives[dir](node, value);
          });
        }
        // 移除專用屬性
        node.removeAttribute(attrName);
      }
    });
  },
  // 2. 字串編譯：比對字串中所有用到的 exp，加入監聽器
  compileText(node) {
    const text = node.textContent,
      self = this,
      reg = /\{\{(.*)\}\}/;
    if (reg.test(text)) {
      const { exps, value } = self.render(text.trim(), self.$data);
      self.directives.text(node, value);
      // 字串節點中，所有用到的 exp 都需依序加入監聽器
      exps.forEach((exp) => {
        new Watcher(this.$data, exp, function() {
          const { value } = self.render(text.trim(), self.$data);
          self.directives.text(node, value);
        });
      });
    }
  },
  // 依據給予的 data 對傳入的字串進行模板編譯，返回編譯後的內容及使用的 exp 值
  render(str, data) {
    const self = this;
    let exps = null;
    str = String(str);
    const t = function(str) {
      const re = /\{\{\s*([^\}]+)?\s*\}\}/g;
      exps = self.removeWrapper(str.match(re)); // 提取符合的字串後移除大括號
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
  // 工具
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
  _getDataVal(exp) {
    let val = this.$data;
    exp = exp.split('.');
    exp.forEach((k) => {
      val = val[k];
    });
    return val;
  },
  // 指令設定
  directives: {
    text(node, value) {
      node.textContent = value;
    },
    html(node, value) {
      node.innerHTML = value;
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
}