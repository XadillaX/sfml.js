import * as util from 'util';

import { Color as _Color, setRealColorConstructor } from './binding';

const TO_INTEGER = Symbol('Color#toInteger');

export type ColorValue = number;
export class Color extends _Color {
  [util.inspect.custom](_: number, opts: any) {
    return `Color ${util.inspect({
      ...this.toJSON(),
      [TO_INTEGER]: this.toInteger(),
    }, opts)}`;
  }

  toJSON() {
    return { r: this.r, g: this.g, b: this.b, a: this.a };
  }

  constructor();
  constructor(r: number, g: number, b: number, a?: number);
  constructor(colorInteger: number);
  constructor(colorOrR?: number, g?: number, b?: number, a?: number) {
    if (arguments.length === 0) {
      super();
    } else if (g === undefined) {
      super(colorOrR as number);
    } else {
      if (a === undefined) {
        a = 0xff;
      }
      super(colorOrR as number, g as number, b as number, a);
    }
  }

  get r() {
    return super.r;
  }

  set r(value: number) {
    value = Math.floor(value);
    if (value < 0 || value > 0xff) {
      throw new Error(`Color.r must be between 0 and 0xff, got ${value}`);
    }
    super.r = value;
  }

  get g() {
    return super.g;
  }

  set g(value: number) {
    value = Math.floor(value);
    if (value < 0 || value > 0xff) {
      throw new Error(`Color.g must be between 0 and 0xff, got ${value}`);
    }
    super.g = value;
  }

  get b() {
    return super.b;
  }

  set b(value: number) {
    value = Math.floor(value);
    if (value < 0 || value > 0xff) {
      throw new Error(`Color.b must be between 0 and 0xff, got ${value}`);
    }
    super.b = value;
  }

  get a() {
    return super.a;
  }

  set a(value: number) {
    value = Math.floor(value);
    if (value < 0 || value > 0xff) {
      throw new Error(`Color.a must be between 0 and 0xff, got ${value}`);
    }
    super.a = value;
  }
}

export type ColorType = Color | ColorValue;

setRealColorConstructor((...args: any[]) => new (Color as any)(...args));
