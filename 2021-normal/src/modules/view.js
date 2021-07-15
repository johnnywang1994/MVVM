import initView from './init';
import { reactive, watchEffect } from './observer';

function View(options) {
  this.options = options;
  initView(this);
}

View.prototype.reactive = reactive;
View.prototype.watchEffect = watchEffect;
View.prototype.extend = function extendView(options) {
  return new View(options);
};

export default View;
