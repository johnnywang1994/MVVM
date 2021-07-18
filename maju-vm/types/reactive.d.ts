export interface EffectType {
  (): any;
  options?: any;
}

export interface EffectOptions {
  lazy?: boolean;
  scheduler?: Function;
}

export interface RefType {
  _isRef: boolean;
  value: any;
}

export type KeyParam = symbol | string;