import { renderValue } from '@/utils';
import globalDirectives from './directive';
import { watchEffect } from './observer';

function isElementNode(node) {
  return node.nodeType === 1;
}

function isTextNode(node) {
  return node.nodeType === 3;
}

function isDirective(attrName) {
  return attrName.startsWith('j-');
}

function hasChildNodes(node) {
  return node.childNodes && node.childNodes.length;
}

function createBinding(el, attr) {
  const { name, value } = attr;
  const dir = name.slice(2);
  const [dirOn, eventType] = dir.split(':');
  const [item, list] = value.split(' in ');
  const binding = {
    el,
    dir,
    value,
  };
  if (eventType) {
    binding.dir = dirOn;
    binding.eventType = eventType;
  }
  if (item && list) {
    binding.item = item;
    binding.list = list;
  }
  return binding;
}

function compileElement(node, vm) {
  const attrs = node.attributes;
  [...attrs].forEach((attr) => {
    const { name } = attr;
    if (isDirective(name)) {
      // remove directive
      node.removeAttribute(name);
      const binding = createBinding(node, attr);
      const $dir = globalDirectives[binding.dir];

      if (typeof $dir === 'function') {
        watchEffect(() => $dir(node, binding, vm));
      } else {
        $dir.bind(node, binding, vm);
        if ($dir.update) {
          watchEffect(() => {
            $dir.update(node, binding, vm);
          });
        }
      }
    }
  });
}

export function render(str, vm) {
  const re = /\{\{([^}]+)?\}\}/g;
  const matched = str.match(re);
  if (matched) {
    return str.replace(re, ($0, $1) => renderValue($1, vm));
  }
  return str;
}

function compileTextNode(node, vm) {
  const rawStr = node.textContent;
  const binding = createBinding(node, {
    name: 'j-text',
    value: '',
  });
  watchEffect(() => {
    binding.value = render(rawStr, vm);
    globalDirectives[binding.dir](node, binding);
  });
}

export function compile(node, vm) {
  const childs = node.childNodes;
  for (let i = 0; i < childs.length; ++i) {
    const child = childs[i];

    if (isElementNode(child)) {
      compileElement(child, vm);
    } else if (isTextNode(child)) {
      compileTextNode(child, vm);
    }

    if (!child._forloop_ && hasChildNodes(child)) {
      compile(child, vm);
    }
  }
}
