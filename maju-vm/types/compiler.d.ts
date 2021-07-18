export type BindingForScope = {
  itemName: string;
  indexName: string;
}

export interface BindingOptions {
  node: HTMLElement;
  dir: string;
  type: string;
  raw: string;
  forScope: BindingForScope;
  value: any;
}

export interface BindingInstance {
  node: HTMLElement;
  dir: string;
  type: string;
  raw: string;
  forScope: BindingForScope;
  value: any;
  fetch(): void;
  renderItem?(item: any, i: number): Node;
  [key: string]: any;
}

export type CreateDirectiveOptions = Function | DirectiveInstance;

export interface DirectiveInstance {
  bind: Function;
  update?: Function;
}

export interface DirectivesType {
  [directive: string]: DirectiveInstance;
}

