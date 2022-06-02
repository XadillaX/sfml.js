import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Drawable as _Drawable,
} from '../binding';
// eslint-disable-next-line import/namespace
import * as binding from '../binding';

const RAW = Symbol('Drawable#raw');

export class Drawable {
  [RAW]: _Drawable;

  constructor(classNameInBinding: string, ...args: any[]) {
    // eslint-disable-next-line import/namespace
    const RawClz = binding[classNameInBinding];
    if (!RawClz) {
      throw new Error(`Class ${classNameInBinding} not found`);
    }
    this[RAW] = new RawClz(...args);
  }

  // DO NOT USE THIS METHOD UNLESS YOU KNOW WHAT YOU ARE DOING
  _raw() {
    return this[RAW];
  }
}
