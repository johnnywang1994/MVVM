export function renderValue(value, vm) {
  return new Function('', `with (this) { return ${value} }`).call(vm.data);
}

export default {};
