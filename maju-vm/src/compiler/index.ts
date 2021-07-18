import { renderTemplate, renderValue } from './render';
import createBinding from './binding';
import { watchEffect } from '../reactive';
import { isElementNode, isTextNode, hasChildNodes, isDirective } from './utils';
import Directives from './directive';
import { MajuContext, BindingInstance } from 'types';


function formatAttributeName(name: string) {
  if (name.startsWith(':')) {
    return name.replace(/^:(\w+)$/, 'd-bind:$1');
  } else if (name.startsWith('@')) {
    return name.replace(/^@(\w+)$/, 'd-on:$1');
  }
  return name
}


function parseAttrBinding(
  node: HTMLElement,
  attr: Attr,
  data: Object,
): BindingInstance {
  let { name, value: rawValue } = attr;
  const raw = rawValue;
  // format attrname
  name = formatAttributeName(name);
  // parse attribute
  let dir = name.slice(2);
  let type = '';
  const [dirLeft, dirRight] = dir.split(':');
  if (dirRight) {
    dir = dirLeft;
    type = dirRight;
  }
  // parse "for" value
  let forScope = {
    itemName: '',
    indexName: '',
  };
  if (dir === 'for') {
    const [, rawItem, rawList] =
      rawValue.match(/(.*)\s+in\s+(.*)/) as Array<string>;
    [, forScope.itemName, forScope.indexName] =
      rawItem.trim().match(/(\w+),?\s?(\w+)?/) as Array<string>;
    rawValue = rawList.trim();
  }
  // create binding instance
  const binding = createBinding({
    node,
    dir,
    type,
    raw,
    forScope,
    value: '',
  });
  binding.fetch = () => binding.value = renderValue(rawValue, data);
  return binding;
}


export function compileElement(node: HTMLElement, context: MajuContext) {
  const attrs = node.attributes;
  [...attrs].forEach((attr) => {
    const { name } = attr;

    if (isDirective(name)) {
      const binding = parseAttrBinding(node, attr, context._data);
      const $dir = Directives[binding.dir];
      
      if ($dir) {
        // remove directive
        node.removeAttribute(name);
        binding.fetch();
        $dir.bind(node, binding, context);
        if ($dir.update) {
          watchEffect(() => {
            binding.fetch();
            $dir.update && $dir.update(node, binding, context);
          });
        }
      }
    }
  });
}


function compileTextNode(node: HTMLElement, context: MajuContext) {
  const rawStr = node.textContent;
  if (rawStr) {
    const binding = parseAttrBinding(node, {
      name: 'd-text',
      value: rawStr,
    } as Attr, context);
    // change renderValue to use renderTemplate
    binding.fetch = () => {
      binding.value = renderTemplate(binding.raw, context._data);
    };

    const $dir = Directives[binding.dir];
    binding.fetch();
    $dir.bind(node, binding, context);

    watchEffect(() => {
      binding.fetch();
      $dir.update && $dir.update(node, binding, context);
    });
  }
}


export function compile(node: HTMLElement, context: MajuContext) {
  const childs = node.childNodes;

  if (node === context.el) {
    compileElement(node, context);
  }

  for (let i = 0; i < childs.length; ++i) {
    const child: any = childs[i];
    if (isElementNode(child)) {
      compileElement(child, context);
    } else if (isTextNode(child)) {
      compileTextNode(child, context);
    }

    if (!child._forloop_ && hasChildNodes(child)) {
      compile(child, context);
    }
  }
}
