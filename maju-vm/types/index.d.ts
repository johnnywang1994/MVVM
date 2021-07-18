export {
  BindingForScope,
  BindingOptions,
  BindingInstance,
  CreateDirectiveOptions,
  DirectiveInstance,
  DirectivesType,
  compileElement,
  compile,
} from './compiler';

export {
  EffectType,
  EffectOptions,
  RefType,
  KeyParam,
  reactive,
  ref,
  computed,
  watchEffect
} from './reactive';

export interface MajuOptions {
  el: HTMLElement;
  view: string;
  data: {
    [key: string]: any;
  };
  init?(this: MajuContext): Object;
}

export interface MajuContext {
  el: HTMLElement;
  _data: {
    [key: string]: any;
  };
  reactive: reactive;
  ref: ref;
  computed: computed;
  watchEffect: watchEffect;
  compile: compile;
}

