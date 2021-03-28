import { renderValue } from '@/utils';

function patchChildren(oldCh, ch) {

}

const globalDirectives = {
  text(el, binding) {
    el.textContent = binding.value;
  },
  html(el, binding) {
    el.innerHTML = binding.value;
  },
  show(el, binding, vm) {
    const { value } = binding;
    const showState = renderValue(value, vm);
    el.style.display = showState ? null : 'none';
  },

  bind(el, binding, vm) {
    const { eventType, value } = binding;
    if (eventType in globalDirectives) {
      globalDirectives[eventType](
        el,
        {
          el,
          dir: eventType,
          value: renderValue(value, vm),
        },
        vm,
      );
    }
  },

  on(el, binding, vm) {
    const { eventType, value } = binding;
    if (eventType) {
      const fn = new Function(
        '',
        `
          with (this) {
            const result = eval(${value});
            if (typeof result === 'function') {
              result.call(this);
            }
          }
        `,
      ).bind(vm.data);
      el.addEventListener(eventType, fn, false);
    }
  },

  if: {
    bind(el, binding) {
      const ref = (binding.ref = document.createComment(''));
      const ctn = (binding.ctn = el.parentNode);
      ctn.insertBefore(ref, el);
    },
    update(el, binding, vm) {
      const { value, ref, ctn } = binding;
      const showState = renderValue(value, vm);
      if (showState) {
        ctn.insertBefore(el, ref);
        ctn.removeChild(ref);
      } else {
        ctn.insertBefore(ref, el);
        ctn.removeChild(el);
      }
    },
  },

  for: {
    bind(el, binding) {
      const ref = (binding.ref = document.createComment(''));
      const ctn = el.parentNode;
      ctn.insertBefore(ref, el);
      ctn.removeChild(el);
      binding.ctn = ref.parentNode;
      binding.oldCh = new Map();
      el._forloop_ = true;
    },
    update(el, binding, vm) {
      const { oldCh, ctn, list: rawList } = binding;
      const list = renderValue(rawList, vm);
      const aliveItems = [];
      list.forEach((item) => {
        if (oldCh.has(item)) {
          console.log('exist');
          aliveItems.push(item);
          return;
        }
        const copy = this.buildItem(el, binding, vm, item);
        oldCh.set(item, copy);
        aliveItems.push(item);
      });
      // remove oldCh not in view
      Object.entries(oldCh).forEach(([item, node]) => {
        // TODO: not trigger watch effect
        console.log('remove');
      })
    },
    buildItem(el, binding, vm, bindItem) {
      const { item: rawItem, ref, ctn } = binding;
      const node = el.cloneNode(true);
      const childVM = vm.extend({
        el: node,
        setup() {
          return {
            [rawItem]: bindItem,
          }
        },
      });
      ctn.insertBefore(node, ref);
      return node;
    },
  },
};

export default globalDirectives;
