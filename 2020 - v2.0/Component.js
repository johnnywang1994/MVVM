function Component(name, options) {
  this.$name = name;
  this.$options = options;
  this.$data = this.$options.data;
  this.$template = this.$options.template;
  return this;
}

Component.prototype = {
  HTMLParser(str) {
    const parser = new DOMParser();
    return parser.parseFromString(str, 'text/html').body.childNodes[0];
  },
  init() {
    const self = this;
    // 回傳 viewModel 未初始化的實例
    // el, data 為動態產生，每次 init 得到的組件都為獨立的資料跟元素
    return new ViewModel({
      ...self.$options,
      el: self.HTMLParser(self.$template),
      data: self.$data(),
    });
  },
};