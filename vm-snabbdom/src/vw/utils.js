export function isObject(v) {
  return v !== null && typeof v === 'object';
}

export function isFn(v) {
  return typeof v === 'function';
}

export function setArray(arr, {
  push,
  pop
}) {
  Object.defineProperty(arr, 'push', {
    enumerable: false, // hide from for...in
    configurable: false, // prevent further meddling...
    writable: false, // see above ^
    value: function() {
      let n = this.length;
      for (let i = 0, l = arguments.length; i < l; i++, n++) {          
        push(arguments[i], n, this);
      }
      return n;
    }
  })
  Object.defineProperty(arr, 'pop', {
    enumerable: false, // hide from for...in
    configurable: false, // prevent further meddling...
    writable: false, // see above ^
    value: function() {
      const item = Array.prototype.pop.call(this);
      pop(item, null, this);
      return item;
    }
  })
}

export function getEl(el) {
  return typeof el === 'string'
    ? document.querySelector(el)
    : el;
}

export function getData(data) {
  if (isFn(data)) {
    return data();
  }
  return data || {};
}
