import { reactive, effect, computed } from './reactive';
import { renderCx, patch } from './vdom';
import { getEl, getData } from './utils';

const { h } = renderCx;
let uid = 0;

function VM(options) {
  this.uid = ++uid;
  this.$options = options;
  this.$vnode = undefined;
  this.$render = options.render;
  this.$el = getEl(options.el);
  this.$parent = options.parent;
  this.$props = options.props;
  this.$components = undefined;
  this.$childrens = [];
  this.$data = reactive(getData(options.data));
  this._setComponent();
  this._setMethods();
  this._setComputed();
  if (this.$parent) {
    this.$parent.$childrens.push(this);
  }
  if (this.$el) {
    this.mount();
  }
}

VM.prototype.mount = function(el) {
  if (el) {
    this.$el = getEl(el);
  }
  const updateMount = () => {
    const vnode = this.$render.call(this, renderCx);
    patch(
      this.$vnode ? this.$vnode : this.$el,
      vnode,
    );
    this.$vnode = vnode;
  };
  effect(updateMount);
}

VM.prototype._setMethods = function() {
  const { methods } = this.$options;
  if (methods) {
    for (let key in methods) {
      this.$data[key] = methods[key].bind(this.$data);
    }
  }
};

VM.prototype._setComputed = function() {
  const { computed: com } = this.$options;
  if (com) {
    for (let key in com) {
      const newComputed = computed(com[key].bind(this.$data));
      Object.defineProperty(this.$data, key, {
        get: () => newComputed.value,
      })
    }
  }
}

VM.prototype._setComponent = function() {
  const { components } = this.$options;
  if (components) {
    const ctn = this.$components = Object.create(null);
    for (let key in components) {
      const component = components[key];
      component.parent = this;
      ctn[key] = component;
    }
  }
}

VM.prototype._setProps = function(propsMap) {
  const { parent, props } = this.$options;
  if (parent && props) {
    for (let key in propsMap) {
      if (!this.$data[key] && props.includes(key)) {
        const prop = computed(propsMap[key]);
        Object.defineProperty(this.$data, key, {
          get: () => prop.value,
        });
      }
    }
  }
}

VM.prototype._compiler = function(tag, attrs) {
  let props = attrs || {};
  let children = [];
  let options = {
    attrs: {},
    on: {}
  };
  for (const key in props) {
    // event
    if (key.startsWith('on')) {
      options.on[key.slice(2).toLocaleLowerCase()] = props[key];
    } else {
      // normal
      options.attrs[key] = props[key];
    }
  }

  for (let i = 2; i < arguments.length; i++) {
    let vnode = arguments[i];
    children.push(vnode);
  }
  return h(tag, options, children);
}

export default VM;
