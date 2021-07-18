import { BindingInstance, DirectivesType, DirectiveInstance, CreateDirectiveOptions, MajuContext } from 'types';

function createDirective(options: CreateDirectiveOptions): DirectiveInstance {
  if (typeof options === 'function') {
    return { bind: options, update: options };
  }
  return options;
}


const text = createDirective((
  node: HTMLElement,
  binding: BindingInstance
): void => {
  node.textContent = binding.value;
});


const html = createDirective((
  node: HTMLElement,
  binding: BindingInstance
): void => {
  node.innerHTML = binding.value;
});


const show = createDirective((
  node: HTMLElement,
  binding: BindingInstance,
): void => {
  node.style.display = binding.value ? '' : 'none';
});


const bind = createDirective((
  node: HTMLElement,
  binding: BindingInstance,
): void => {
  node.setAttribute(binding.type, binding.value);
});


const eventOn = createDirective({
  bind(node: HTMLElement, binding: BindingInstance): void {
    const { type, value } = binding;
    if (type) {
      node.addEventListener(type, value, false);
    }
  },
});


const existIf = createDirective({
  bind(node: HTMLElement, binding: BindingInstance): void {
    const ref = (binding.ref = document.createComment(''));
    const ctn = (binding.ctn = node.parentNode);
    ctn && ctn.insertBefore(ref, node);
  },
  update(node: HTMLElement, binding: BindingInstance): void {
    const { value, ref, ctn } = binding;
    if (value) {
      ctn.insertBefore(node, ref);
      ctn.removeChild(ref);
    } else {
      ctn.insertBefore(ref, node);
      ctn.removeChild(node);
    }
  },
})


const renderListFor = createDirective({
  bind(node: HTMLElement, binding: BindingInstance, context: MajuContext): void {
    const { compile } = context;
    const { forScope } = binding;
    const ref = (binding.ref = document.createComment('d-for'));
    const ctn = (binding.ctn = node.parentNode);

    // mark node as forloop to skip original compile
    (node as any)._forloop_ = true;

    const renderItem = (list: Array<any>, i: number): Node => {
      const childNode = node.cloneNode(true);
      const childContext: MajuContext = {
        ...context,
        _data: {
          ...context._data,
          get [forScope.indexName]() {
            return i;
          },
          // use getter to track source object correctly
          get [forScope.itemName]() {
            return list[i];
          },
        },
      };

      // mark node as forloop to skip original compile
      (childNode as any)._forloop_ = true;

      compile(childNode, childContext);

      return childNode;
    };

    if (ctn) {
      ctn.insertBefore(ref, node);
      ctn.removeChild(node);
    }

    binding.created = false;
    binding.renderItem = renderItem;
  },
  update(node: HTMLElement, binding: BindingInstance, context: MajuContext): void {
    const { renderItem, value: itemList, ctn, ref } = binding;

    if (!binding.created && renderItem) {
      for (let i = 0; i < itemList.length; i++) {
        const childNode = renderItem(itemList, i);
        ctn && ctn.insertBefore(childNode, ref);
      }
      binding.created = true;
    }
  },
})

const Directives: DirectivesType = {
  text,
  html,
  show,
  bind,
  on: eventOn,
  if: existIf,
  for: renderListFor,
};

export default Directives;
