import { MajuOptions, MajuContext } from 'types';
import { reactive, ref, computed, watchEffect } from './reactive';
import { compile } from './compiler';

export function createContext(options: MajuOptions): MajuContext {
  return {
    el: options.el,
    _data: {},
    reactive,
    ref,
    computed,
    watchEffect,
    compile,
  };
}
