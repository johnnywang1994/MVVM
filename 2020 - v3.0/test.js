const prefix = 'c';
const directives = {
  text(el, binding) {
    el.textContent = binding.value;
  },
  html(el, binding) {
    el.innerHTML = binding.value;
  },
};

function isElementNode(node) {
  return node.nodeType === 1;
}

function hasChildNodes(node) {
  return node.childNodes && node.childNodes.length;
}

function getBinding(attr) {
  const { name, value } = attr;
  const key = name.split('-')[1];
  const dir = directives[key];
  return {
    name,
    value,
    key,
    dir,
  };
}

function compiler(el) {
  this.$el = el;
  const fg = node2Fragment(el);
  compileNode(fg);
  this.$el.appendChild(fg);
}

function node2Fragment(node) {
  const fg = document.createDocumentFragment();
  while (node.firstChild) {
    fg.appendChild(node.firstChild);
  }
  return fg;
}

function compileNode(node) {
  const childs = node.childNodes;
  childs.forEach((child) => {
    if (isElementNode(child)) {
      compileElement(child);
    }
    if (hasChildNodes(child)) {
      compileNode(child);
    }
  });
}

function compileElement(node) {
  const attrs = node.attributes;
  [...attrs].forEach((attr) => {
    const binding = getBinding(attr);
    if (binding.dir) {
      binding.dir(node, binding);
    }
    node.removeAttribute(binding.name);
  })
}

compiler(document.querySelector('#app'));


function replaceString(data) {
  return function(raw, content) {
    return data[content.trim()];
  };
}

function render(str, data) {
  return str.replace(/\{\{\s*([^\}]+)?\s*\}\}/g, replaceString(data));
}

const str = 'Hello {{ name }}, {{ age }}';
const data = {
  name: 'Johnny',
  age: 30,
};
const result = render(str, data);
console.log(result);