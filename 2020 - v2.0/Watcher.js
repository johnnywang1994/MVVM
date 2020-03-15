function Watcher(vm, exp, cb) {
  this.$vm = vm;
  this.$exp = exp;
  this.$cb = cb;
  this.init();
}

Watcher.prototype = {
  update() {
    this.run();
  },
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
    !this._hasInit && (DependStore.target = this);
    const value = this._getVMVal(this.$exp);
    DependStore.target = null;
    return value;
  },
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