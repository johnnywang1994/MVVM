/*
* Dependency object
* contains binding objects in "deps"
*/
function Dep() {
  this.deps = [];
}

Dep.prototype.add = function(binding) {
  this.deps.push(binding);
}

Dep.prototype.update = function() {
  this.deps.forEach((binding) => binding.update());
}

/*
* Binding object
*/
function Binding(key, callback) {
  this.key = key;
  this.update = callback;
}

/*
* Observer
*/
function Observer(data) {
  this.$data = data;
  this._bindings = {};
  this._observe(this.$data);
  
  // bind method to itself
  this.$set = this._defineReactive.bind(this, this.$data);
  this.$computed = this._defineComputed.bind(this, this.$data);
  this.$watch = this._defineWatcher.bind(this, this.$data);
}

Observer.prototype._observe = function(data) {
  if (!data || typeof data !== 'object') return;
  Object.keys(data).forEach((key) => {
    this._defineReactive(data, key, data[key]);
  });
}

Observer.prototype._defineReactive = function(data, key, val) {
  const self = this;
  const deps = self._bindings[key] = new Dep();
  self._observe(val);
  Object.defineProperty(data, key, {
    get() {
      if (Dep.target) deps.add(Dep.target);
      return val;
    },
    set(newValue) {
      if (val === newValue) return;
      val = newValue;
      self._observe(val);
      deps.update();
    },
  });
}

Observer.prototype._defineComputed = function(data, key, computeFn) {
  const self = this;
  const binding = new Binding(key, function() {
    return computeFn.call(self);
  });
  Dep.target = binding;
  computeFn.call(self);
  Dep.target = null;
  
  // bind reactive key
  Object.defineProperty(data, key, {
    get() {
      return computeFn.call(self);
    },
    set() {}
  });
}

Observer.prototype._defineWatcher = function(data, key, callback) {
  const self = this;
  const binding = new Binding(key, function() {
    const value = data[key];
    callback.call(self, value);
  }, true);
  Dep.target = binding;
  data[key];
  Dep.target = null;
}


const person = new Observer({
  name: 'Johnny',
  age: 30,
});

// person.$set('info', {
//   height: 180,
//   weight: 70
// });

person.$computed('info', function() {
  return this.$data.name + ' ' + this.$data.age;
});

person.$watch('info', function(newValue) {
  console.log('watched! ' + newValue);
});

// person.$data.info;
// person.$data.info;
// person.$data.name;
person.$data.name = 'Kevin';
person.$data.age = 1000;

console.log(person);