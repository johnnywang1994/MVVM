import { init } from 'snabbdom';
import { classModule } from 'snabbdom/modules/class';
import { propsModule } from 'snabbdom/modules/props';
import { attributesModule } from 'snabbdom/modules/attributes';
import { styleModule } from 'snabbdom/modules/style';
import { eventListenersModule } from 'snabbdom/modules/eventlisteners';
import { h } from 'snabbdom/h';
import VM from './viewmodel';
import { effect } from './reactive';

export const renderCx = { h, c };

function c(options, propsMap, key) {
  const { parent } = options;
  let Sub = parent.$childrens[key];
  if (Sub) {
    return Sub.$vnode;
  }
  Sub = new VM(options);
  if (propsMap) {
    Sub._setProps(propsMap);
  }
  const updateMount = () => {
    const vnode = Sub.$render.call(Sub, renderCx);
    if (Sub.$vnode) {
      patch(Sub.$vnode, vnode);
    }
    Sub.$vnode = vnode;
  };
  effect(updateMount);
  return Sub.$vnode;
}

export const patch = init([ // Init patch function with chosen modules
  classModule, // makes it easy to toggle classes
  propsModule, // for setting properties on DOM elements
  attributesModule, // attributes module
  styleModule, // handles styling on elements with support for animations
  eventListenersModule, // attaches event listeners
]);
