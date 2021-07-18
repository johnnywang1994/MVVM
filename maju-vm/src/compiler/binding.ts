import { BindingOptions, BindingInstance, BindingForScope } from 'types';

class Binding {
  constructor(
    public node: HTMLElement,
    public dir: string,
    public type: string,
    public raw: string,
    public forScope: BindingForScope,
    public value: string,
  ) {}

  fetch() {}
}

export default function createBinding(options: BindingOptions): BindingInstance {
  const { node, dir, type, raw, forScope, value } = options;
  return new Binding(node, dir, type, raw, forScope, value);
}
