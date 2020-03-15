/**
 * Observer
 * @param {object} data => 內部數據劫持，當內部數據改變時，調用各別掛載的 watchers
 * 此處處理的是最原始傳入的 data 資料，並非 mvvm 的實例
 */
function Observer(data) {
  this.$data = data;
  this.observe(this.$data);
}

Observer.prototype = {
  observe(data) {
    const self = this;
    if (!data || typeof data !== 'object') return;
    Object.keys(data).forEach((key) => {
      self.defineReactive(data, key, data[key]);
    });
  },
  defineReactive(data, key, val) {
    const self = this;
    const dep = new Dep(); // 建立屬性的監聽器依賴
    self.observe(val); // 監聽子屬性
    Object.defineProperty(data, key, {
      enumerable: true,
      configurable: false,
      get() {
        Dep.target && dep.addSub(Dep.target); // 裝入對應 watcher(由 compiler 主動建立 watcher 時內部掛載)
        return val;
      },
      set(nV) {
        if (nV === val) return;
        val = nV;
        self.observe(nV); // 監聽新屬性值
        dep.notify(); // 通知更新
      }
    })
  }
};


function Dep() {
  this.subs = [];
}

Dep.prototype = {
  addSub(sub) {
    this.subs.push(sub);
  },
  notify() {
    this.subs.forEach((sub) => sub.update());
  }
};
