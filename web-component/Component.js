function Component(tagName, opts) {
  this.$tagName = tagName;
  this.$opts = opts;
  this.$root = null;
  this.$el = null;
  this.$data = null;
  this.init();
  return this.$el;
}

Component.prototype = {
  init() {
    this.defineTag();
  },
  defineTag() {
    const self = this;
    const { html } = self.$opts;
    self.$el = class extends HTMLElement {
      constructor(data) {
        super();
        // get el, data
        const el = self.getNode(html);
        self.$data = data;
        // set MVVM
        new Observer(self.$data);
        new Compiler(el, {
          data: self.$data,
          prefix: self.$opts.prefix || 'w'
        });
        // set Web Component
        self.initRoot(this);
        self.insertStyle();
        self.$root.appendChild(el);
      }
    }
    customElements.define(self.$tagName, self.$el);
  },
  initRoot(__root) {
    const useShadow = document.head.attachShadow && this.$opts.shadow;
    this.$root = useShadow ? __root.attachShadow({mode: 'open'}) : __root;
  },
  insertStyle() {
    if (this.$opts.stylesheet) {
      const linkEl = document.createElement('link');
      linkEl.setAttribute('rel', 'stylesheet');
      linkEl.setAttribute('href', this.$opts.stylesheet);
      this.$root.appendChild(linkEl);
    }
  },
  /* Tool */
  getNode(str) {
    return new DOMParser().parseFromString(str, 'text/html').body.childNodes[0];
  }
}