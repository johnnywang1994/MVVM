const prefix = 'c-';
const directives = {
  text(el, binding) {
    el.textContent = binding.value;
  },
  html(el, binding) {
    el.innerHTML = binding.value;
  },
  show(el, binding) {
    el.style.display = binding.value ? null : 'none';
  },
  if: {
    bind(el, binding) {
      const ref = binding.ref = document.createComment('');
      const ctn = binding.ctn = el.parentNode;
      ctn.insertBefore(ref, el);
    },
    update(el, binding) {
      const { value, ref, ctn } = binding;
      if (value) {
        ctn.insertBefore(el, ref);
        ctn.removeChild(ref);
      } else {
        ctn.insertBefore(ref, el);
        ctn.removeChild(el);
      }
    },
  },
  bind(el, binding) {
    const { raw, value } = binding; 
    el.setAttribute(raw, value);
  },
  on(el, binding) {
    const { raw: eventType, value, oldValue } = binding;
    const fn = value;
    if (oldValue) {
      el.removeEventListener(eventType, oldValue);
    }
    if (eventType && fn) {
      el.addEventListener(eventType, fn, false);
    }
  },
  for: {
    bind(el, binding) {
      const ref = binding.ref = document.createComment('');
      const ctn = el.parentNode;
      binding.collection = new Set();
      ctn.insertBefore(ref, el);
      ctn.removeChild(el);
      el._forloop_ = true;
    },
    update(el, binding, vm) {
      const { value, ref, collection } = binding;
      const ctn = binding.ctn = ref.parentNode;
      if (collection.size > 0) {
        collection.forEach((copy) => {
          ctn.removeChild(copy);
        });
        collection.clear();
      }
      for (let i in value) {
        const copy = this.buildItem(el, binding, vm, value[i]);
        collection.add(copy);
      }
    },
    buildItem(el, binding, vm, bindItem) {
      const { item, ref, ctn } = binding;
      const node = el.cloneNode(true);
      node._forloop_ = true;
      const childVM = new VM({
        el: node,
        parent: vm,
        data: {
          [item]: bindItem
        }
      });
      ctn.insertBefore(node, ref);
      return node;
    },
  },
};

function isElementNode(node) {
  return node.nodeType === 1;
}

function isTextNode(node) {
  return node.nodeType === 3;
}

function isDirective(attrName) {
  return attrName.startsWith(prefix);
}

function isComponent(tagName, comps) {
  return Object.keys(comps).includes(tagName);
}

function isEventDirective(attrName) {
  return attrName.indexOf('on') === 0;
}

function hasChildNodes(node) {
  return node.childNodes && node.childNodes.length;
}

function getBinding(attr) {
  const { name, value } = attr;
  let [key, raw] = name.split(':');
  key = key.split('-')[1];
  const dir = directives[key];
  const [item, list] = value.split(' in ');
  return {
    name,
    key,
    raw,
    dir,
    ...(list ? {
      item,
      value: list
    } : { value }),
  };
}

function getRenderedBinding(binding, vm) {
  const rendered = renderAttr(binding.value, vm.$data);
  return {
    ...binding,
    get oldValue() {
      return rendered.oldValue;
    },
    get value() {
      return rendered.value;
    },
  };
}

function compiler(el, vm) {
  const fg = node2Fragment(el);
  compileNode(fg, vm);
  el.appendChild(fg);
}

function node2Fragment(node) {
  const fg = document.createDocumentFragment();
  while (node.firstChild) {
    fg.appendChild(node.firstChild);
  }
  return fg;
}

function compileNode(node, vm) {
  if (node._forloop_) return;
  const childs = node.childNodes;
  let child = null;
  // "forEach" wont't dynamically get array's length
  for (let i=0;i<childs.length;i++) {
    child = childs[i];
    if (isElementNode(child)) {
      const tagName = child.tagName.toLowerCase();
      if (isComponent(tagName, vm.$components)) {
        compileComponent(child, vm, node);
      } else {
        compileElement(child, vm);
      }
    } else if (isTextNode(child)) {
      compileText(child, vm);
    }
    if (hasChildNodes(child)) {
      compileNode(child, vm);
    }
  }
}

function compileElement(node, vm) {
  const attrs = node.attributes;
  [...attrs].forEach((attr) => {
    if (!isDirective(attr.name)) return;
    let binding = getBinding(attr);
    node.removeAttribute(binding.name);
    if (!binding.dir) return;
    binding = getRenderedBinding(binding, vm);
    if (isFn(binding.dir)) {
      effect(() => {
        binding.dir(node, binding);
      })
    } else {
      const { bind, update } = binding.dir;
      bind.call(binding.dir, node, binding, vm);
      effect(() => {
        update.call(binding.dir, node, binding, vm);
      });
    }
  })
}

function compileText(node, vm) {
  const text = node.textContent.trim(),
    reg = /\{\{(.*)\}\}/;

  if (reg.test(text)) {
    const textBinding = renderText(text, vm.$data);
    effect(() => {
      directives.text(node, textBinding);
    });
  }
}

function compileComponent(node, vm, ctn) {
  const tagName = node.tagName.toLowerCase();
  const rawComp = vm.$components[tagName];
  rawComp.parent = vm;
  const childVM = new VM(rawComp);
  vm.$childrens.push(childVM);
  ctn.replaceChild(childVM.$el, node);
}