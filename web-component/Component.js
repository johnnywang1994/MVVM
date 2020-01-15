// listen to web component attribute
// ref: https://alligator.io/web-components/attributes-properties/
function Component(tagName, opts) {
  this.$tagName = tagName;
  this.$opts = opts;
  this.$webcomponent = null;
  this.init();
  return this.$webcomponent;
}

Component.prototype = {
  init() {
    this.defineTag();
  },
  defineTag() {
    const self = this;
    const { html } = self.$opts;
    /* 閉包實例，data, el, root 屬性為私有 */
    self.$webcomponent = class extends HTMLElement {
      constructor(_props) {
        super();
        // get el, data
        const el = self.getNode(html);
        const data = this.$props = _props || JSON.parse(this.getAttribute('props').replace(/'/g, '"'));
        const root = this.$root = self.initRoot(this);
        // set MVVM
        new Observer(data);
        new Compiler(el, {
          data,
          prefix: self.$opts.prefix || 'w'
        });
        // set Web Component
        self.insertStyle(root);
        root.appendChild(el);
      }
    }
    customElements.define(self.$tagName, self.$webcomponent);
  },
  initRoot(originalRoot) {
    const useShadow = document.head.attachShadow && this.$opts.shadow;
    return useShadow ? originalRoot.attachShadow({mode: 'open'}) : originalRoot;
  },
  insertStyle(root) {
    if (this.$opts.stylesheet) {
      const linkEl = document.createElement('link');
      linkEl.setAttribute('rel', 'stylesheet');
      linkEl.setAttribute('href', this.$opts.stylesheet);
      root.appendChild(linkEl);
    }
  },
  /* Tool */
  getNode(str) {
    return new DOMParser().parseFromString(str, 'text/html').body.childNodes[0];
  }
}