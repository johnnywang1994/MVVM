function Watcher(vm, exp, cb) {
  this.$vm = vm;
  this.$exp = exp;
  this.$cb = cb;
  this.init() // 創建實例的同時，自動觸發掛載
}

Watcher.prototype = {
  // 對外接口
  update() {
    this.run();
  },
  // 初始化
  init() {
    this._hasInit = false;
    this.value = this.get();
    this._hasInit = true;
  },
  run() {
    const value = this.get();
    const oldValue = this.value;
    if (value !== oldValue) {
      this.value = value;
      this.$cb.call(this.$vm, value, oldValue);
    }
  },
  get() {
    !this._hasInit && (Dep.target = this); // 掛載 watcher(只可在初始化時掛載，避免重複掛載)
    // 強制觸發 Observe 的 get 回調，將 watcher 加入 dep 閉包內 subs
    const value = this._getVMVal(this.$exp);
    Dep.target = null; // 移除 watcher(避免後續 get 的時候意外加入此 watcher)
    return value;
  },
  // 工具
  _getVMVal(exp) {
    let val = this.$vm;
    exp = exp.split('.');
    exp.forEach((k) => {
      let re = /\[(\d+)\]/gi;
      if (re.test(k)) {
        let _k = k.split('[')[0];
        let _i = k.split('[')[1].replace(']', '');
        val = val[_k][_i];
      } else {
        val = val[k];
      }
    });
    return val;
  }
}