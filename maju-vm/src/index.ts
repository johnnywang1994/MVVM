import { MajuOptions, MajuContext } from 'types';
import { reactive, ref, computed, watchEffect } from './reactive';
import { compile } from './compiler';
import { createContext } from './context';
import { isObject } from './utils';


function createApp(options: MajuOptions) {
  const context: MajuContext = createContext(options);
  const el = options.el;
  el.innerHTML = options.view;

  if (options.init) {
    context._data = options.init.call(context);
  }

  if (options.data) {
    Object.keys(options.data).forEach((key) => {
      context._data[key] = isObject(options.data[key])
        ? reactive(options.data[key])
        : ref(options.data[key]);
    })
  }

  if (context._data) {
    compile(el, context);
  }
}


const Maju = {
  createApp,
  reactive,
  ref,
  computed,
  watchEffect,
};


export default Maju;