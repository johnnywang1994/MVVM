import { renderValue } from '@/utils';

function removeNodes (
  ch,
  startIdx,
  endIdx,
  removeElm,
) {
  for (; startIdx <= endIdx; ++startIdx) {
    const item = ch[startIdx];
    if (item != null) {
      removeElm(startIdx);
    }
  }
}

function addNodes (
  ch,
  startIdx,
  endIdx,
  createElm,
  injectOld,
) {
  for (; startIdx <= endIdx; ++startIdx) {
    const item = ch[startIdx];
    if (item != null) {
      createElm(item, startIdx);
      injectOld(startIdx);
    }
  }
}

function updateChildrens(oldCh, ch, { el, binding, vm, ctn, nodeMap }) {
  let oldStartIdx = 0;
  let newStartIdx = 0;
  let oldEndIdx = oldCh.length - 1;
  let newEndIdx = ch.length - 1;
  let oldStartItem = oldCh[0];
  let newStartItem = ch[0];
  let oldEndItem = oldCh[oldEndIdx];
  let newEndItem = ch[newEndIdx];
  const newNodeMap = [];

  const removeElm = (index) => {
    ctn.removeChild(nodeMap[index]);
    // replace old with new
    oldCh.splice(index, 1, ch[index]);
    nodeMap.splice(index, 1, newNodeMap[index]);
  };

  const createElm = (item, newIndex, before = null) => {
    const newStartNode = this.buildItem(el, binding, vm, item);
    ctn.insertBefore(newStartNode, before);
    newNodeMap[newIndex] = newStartNode;
  };

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (oldStartItem == null) {
      oldStartItem = oldCh[++oldStartIdx];
    } else if (oldEndItem == null) {
      oldEndItem = oldCh[--oldEndIdx];
    } else if (newStartItem == null) {
      newStartItem = ch[++newStartIdx];
    } else if (newEndItem == null) {
      newEndItem = ch[--newEndIdx];
    // no need to move
    } else if (oldStartItem === newStartItem) {
      oldStartItem = oldCh[++oldStartIdx];
      newStartItem = ch[++newStartIdx];
    } else if (oldEndItem === newEndItem) {
      oldEndItem = oldCh[--oldEndIdx];
      newEndItem = ch[--newEndIdx];
    // need to move
    } else if (oldStartItem === newEndItem) {
      ctn.insertBefore(nodeMap[oldStartIdx], nodeMap[oldEndIdx].nextSibling);
      oldStartItem = oldCh[++oldStartIdx];
      newEndItem = ch[--newEndIdx];
    } else if (oldEndItem === newStartItem) {
      ctn.insertBefore(nodeMap[oldEndIdx], nodeMap[oldStartIdx]);
      oldEndItem = oldCh[--oldEndIdx];
      newStartItem = ch[++newStartIdx];
    // others
    } else {
      const before = nodeMap[oldStartIdx];
      createElm(newStartItem, newStartIdx, before);
      newStartItem = ch[++newStartIdx];
    }
  }

  // inject new to old
  const injectOld = (index) => {
    oldCh[index] = ch[index];
    nodeMap[index] = newNodeMap[index];
  };

  if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
    if (oldStartIdx > oldEndIdx) {
      console.log('add!');
      addNodes(ch, newStartIdx, newEndIdx, createElm, injectOld);
    } else {
      console.log('remove!');
      removeNodes(oldCh, oldStartIdx, oldEndIdx, removeElm);
    }
  }
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
      const ref = (binding.ref = document.createComment('j-for'));
      const ctn = el.parentNode;
      ctn.insertBefore(ref, el);
      ctn.removeChild(el);
      binding.ctn = ref.parentNode;
      binding.oldCh = [];
      binding.nodeMap = [];
      el._forloop_ = true;
    },
    update(el, binding, vm) {
      const { oldCh, ctn, nodeMap, list: rawList } = binding;
      const list = renderValue(rawList, vm);
      updateChildrens.call(this, oldCh, list, { el, binding, vm, ctn, nodeMap });
    },
    buildItem(el, binding, vm, bindItem) {
      const { item: rawItem } = binding;
      const node = el.cloneNode(true);
      const childVM = vm.extend({
        el: node,
        setup() {
          return {
            ...vm.data,
            [rawItem]: bindItem,
          }
        },
      });
      // console.log(childVM);
      return node;
    },
  },
};

export default globalDirectives;
