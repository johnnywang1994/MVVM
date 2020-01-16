function Template(id, opts) {
  this.$id = id;
  this.$opts = opts;
  this.node = null;
  this.init();
  return this;
}

Template.prototype = {
  init() {
    this.node = this.createTemplate();
  },
  createTemplate() {
    const el = document.createElement('template');
    el.id = this.$id;
    el.innerHTML = this.$opts.html;
    document.body.appendChild(el);
    return el.content;
  },
  content(clone) {
    if (clone) {
      return this.node.cloneNode(true);
    }
    return this.node;
  }
}