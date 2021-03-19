import { compile } from './compiler';
import { reactive } from './observer';

export default function initView(vm) {
  const { options } = vm;
  vm.el =
    typeof options.el === 'string'
      ? document.querySelector(options.el)
      : options.el;
  vm.data = reactive(options.setup.call(vm));

  compile(vm.el, vm);
}
