function getNode(str) {
  return new DOMParser().parseFromString(str, 'text/html').body.childNodes[0];
}

function getData(data) {
  if (isFn(data)) {
    return data();
  }
  return data || {};
}

function VM(options) {
  this.$options = options;
  this.$el = typeof options.el === 'string'
    ? document.querySelector(options.el)
    : options.el
      ? options.el
      : typeof options.template === 'string'
        ? getNode(options.template)
        : options.template;
  this.$parent = options.parent;
  this.$props = options.props;
  this.$components = options.components || {};
  this.$childrens = [];
  this.$data = reactive(getData(options.data));
  if (this.$el._forloop_) {
    this._setParent();
  } else if (this.$props) {
    this._setParent(this.$props);
  }
  this._setMethods();
  this._setComputed();
  if (this.$el) {
    compiler(this.$el, this);
  }
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

VM.prototype._setParent = function(props) {
  const { parent } = this.$options;
  if (parent) {
    const inherit = (key, withSetter) => {
      if (!this.$data[key]) {
        Object.defineProperty(this.$data, key, {
          get: () => parent.$data[key],
          set: (newVal) => withSetter
            ? parent.$data[key] = newVal
            : console.error('Please use emit'),
        });
      }
    };
    if (props) {
      for (let i in props) {
        inherit(props[i], false);
      }
    } else {
      for (let key in parent.$data) {
        inherit(key, true);
      }
    }
  }
}